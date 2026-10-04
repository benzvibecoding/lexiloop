"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getDb } from "@/lib/db/client";
import { bulkCreateCards, newCardDefaults } from "@/lib/db/repositories";
import { fetchFreeDict, mapWithLimit, suggestMeaningVi } from "@/lib/dictionary/freeDict";
import { useToasts } from "@/components/common/Toasts";

type Row = { word: string; status: "pending" | "ok" | "fail"; meaning: string };

export function BulkAdd({ deckId, onDone }: { deckId: string; onDone: () => void }) {
  const push = useToasts((s) => s.push);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const abortRef = useState<AbortController | null>(null);

  const words = useMemo(
    () => text.split(/\r?\n/).map((w) => w.trim()).filter(Boolean).slice(0, 500),
    [text],
  );

  async function run(): Promise<void> {
    if (words.length === 0 || running) return;
    const ctrl = new AbortController();
    abortRef[1](ctrl);
    setRunning(true);
    setProgress(0);
    const init: Row[] = words.map((w) => ({ word: w, status: "pending", meaning: "" }));
    setRows(init);
    try {
      const results = await mapWithLimit(
        words,
        2,
        async (w, idx, signal) => {
          try {
            const [entry, vi] = await Promise.all([
              fetchFreeDict(w, signal).catch(() => null),
              suggestMeaningVi(w, signal).catch(() => [] as string[]),
            ]);
            const meaning = vi[0] ?? entry?.definitionEn ?? "";
            setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, status: meaning ? "ok" : "fail", meaning } : r)));
            setProgress((p) => p + 1);
            return { w, entry, meaning };
          } catch {
            setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, status: "fail" } : r)));
            setProgress((p) => p + 1);
            return { w, entry: null, meaning: "" };
          }
        },
        ctrl.signal,
      );
      const ok = results.filter((r) => r.meaning);
      if (ok.length > 0) {
        await bulkCreateCards(
          getDb(),
          ok.map((r) => ({
            ...newCardDefaults(deckId, r.w, [r.meaning]),
            pos: r.entry?.pos ?? [],
            ipaUs: r.entry?.ipaUs,
            ipaUk: r.entry?.ipaUk,
            audioUrl: r.entry?.audioUrl,
            definitionEn: r.entry?.definitionEn,
            examples: r.entry?.examples ?? [],
            synonyms: r.entry?.synonyms ?? [],
            antonyms: r.entry?.antonyms ?? [],
          })),
        );
      }
      push(`Đã thêm ${ok.length}/${words.length} từ. Từ lỗi vẫn có thể thêm tay.`);
      onDone();
    } catch {
      push("Đã hủy thêm hàng loạt.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-3xl border border-dashed border-stone-300 p-4 dark:border-stone-700">
      <h3 className="font-bold">Thêm hàng loạt (mỗi dòng 1 từ)</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={"resilient\ndeadline\nempathy"}
        aria-label="Danh sách từ, mỗi dòng một từ"
        className="mt-2 w-full rounded-xl border border-stone-300 p-3 dark:border-stone-700 dark:bg-stone-950"
      />
      <p className="mt-1 text-xs text-stone-500">{words.length} từ · tự điền song song (tối đa 2) · lỗi thì nhập tay sau.</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => void run()} disabled={running || words.length === 0} className="flex min-h-[44px] items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50">
          {running ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
          {running ? `Đang thêm ${progress}/${words.length}…` : `Thêm ${words.length} từ`}
        </button>
        {running ? (
          <button type="button" onClick={() => abortRef[0]?.abort()} className="min-h-[44px] rounded-2xl border px-4 text-sm font-bold">
            Hủy
          </button>
        ) : null}
      </div>
      {rows.length > 0 ? (
        <ul className="mt-2 max-h-40 overflow-auto text-xs">
          {rows.map((r, i) => (
            <li key={`${r.word}-${i}`}>
              {r.status === "ok" ? "✅" : r.status === "fail" ? "❌" : "⏳"} {r.word} {r.meaning ? `— ${r.meaning}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
