"use client";

import { useState } from "react";
import { getDb } from "@/lib/db/client";
import { bulkCreateCards, newCardDefaults } from "@/lib/db/repositories";
import { detectDelimiter, findDuplicates, parseDelimited, parseJsonCards, parseQuizletPasted, type ImportRow } from "@/lib/import-export/parse";
import { cardsToCsv } from "@/lib/backup/backup";
import { useToasts } from "@/components/common/Toasts";

export function ImportDialog({ deckId, onDone }: { deckId: string; onDone: () => void }) {
  const push = useToasts((s) => s.push);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [dups, setDups] = useState<number>(0);

  async function buildPreview(raw: string): Promise<void> {
    const t = raw.trim();
    if (!t) {
      setPreview([]);
      return;
    }
    let rows: ImportRow[] = [];
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        rows = parseJsonCards(JSON.parse(t) as unknown);
      } catch {
        rows = [];
      }
    } else if (t.includes("\n") && (detectDelimiter(t) !== "," || t.includes(","))) {
      // Thử CSV/TSV trước, fallback Quizlet
      const csv = parseDelimited(t, { word: 0, meaningVi: 1 });
      rows = csv.length > 0 ? csv : parseQuizletPasted(t);
    } else {
      rows = parseQuizletPasted(t);
    }
    const db = getDb();
    const existing = await db.cards.where("deckId").equals(deckId).toArray();
    const dupList = findDuplicates(rows, existing.map((c) => c.word));
    setDups(dupList.length);
    setPreview(rows.slice(0, 200));
  }

  async function onCommit(skipDup: boolean): Promise<void> {
    const db = getDb();
    const existing = new Set(
      (await db.cards.where("deckId").equals(deckId).toArray()).map((c) => c.word.trim().toLowerCase()),
    );
    const rows = preview.filter((r) => (skipDup ? !existing.has(r.word.trim().toLowerCase()) : true));
    await bulkCreateCards(
      db,
      rows.map((r) => ({
        ...newCardDefaults(deckId, r.word, [r.meaningVi]),
        pos: r.pos ? [r.pos] : [],
        examples: r.exampleEn ? [{ en: r.exampleEn, vi: r.exampleVi }] : [],
        tags: r.tags ? r.tags.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [],
      })),
    );
    push(`Đã nhập ${rows.length} thẻ${skipDup && dups > 0 ? ` (bỏ ${dups} trùng)` : ""}.`);
    setPreview([]);
    setText("");
    onDone();
  }

  async function onExportCsv(): Promise<void> {
    const db = getDb();
    const cards = await db.cards.where("deckId").equals(deckId).toArray();
    const csv = cardsToCsv(cards.filter((c) => c.deletedAt == null).map((c) => ({ word: c.word, meaningVi: c.meaningVi })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deck-${deckId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-3xl border border-stone-200 p-4 dark:border-stone-800">
      <h3 className="font-bold">Nhập / Xuất</h3>
      <p className="text-xs text-stone-500">Dán Quizlet (từ⇥nghĩa), CSV (từ,nghĩa), hoặc JSON [{`{word, meaningVi}`}]</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          void buildPreview(e.target.value);
        }}
        rows={5}
        aria-label="Dán dữ liệu nhập"
        className="mt-2 w-full rounded-xl border border-stone-300 p-3 font-mono text-xs dark:border-stone-700 dark:bg-stone-950"
        placeholder={"resilient\tkiên cường\ndeadline\thạn chót"}
      />
      <div className="mt-2 flex items-center gap-2">
        <label className="cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold">
          Chọn file .csv/.json {fileName ? `(${fileName})` : ""}
          <input
            type="file"
            accept=".csv,.tsv,.txt,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFileName(f.name);
              void f.text().then((t) => {
                setText(t);
                void buildPreview(t);
              });
            }}
          />
        </label>
        <button type="button" onClick={() => void onExportCsv()} className="rounded-xl border px-3 py-2 text-xs font-bold">
          Xuất CSV
        </button>
      </div>
      {preview.length > 0 ? (
        <div className="mt-2">
          <p className="text-xs">Xem trước {preview.length} dòng {dups > 0 ? `· phát hiện ${dups} trùng` : ""}</p>
          <ul className="mt-1 max-h-32 overflow-auto text-xs">
            {preview.slice(0, 20).map((r, i) => (
              <li key={i}>• {r.word} — {r.meaningVi}</li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => void onCommit(false)} className="min-h-[44px] rounded-2xl bg-orange-500 px-4 text-sm font-bold text-white">
              Nhập {preview.length} thẻ
            </button>
            {dups > 0 ? (
              <button type="button" onClick={() => void onCommit(true)} className="min-h-[44px] rounded-2xl border px-4 text-sm font-bold">
                Bỏ trùng, nhập {preview.length - dups}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
