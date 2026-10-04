"use client";

import { useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Pencil, Trash2 } from "lucide-react";
import { getDb } from "@/lib/db/client";
import { resetCardProgress } from "@/lib/deck/actions";
import { useToasts } from "@/components/common/Toasts";
import { useDbMounted } from "@/stores/settings";
import type { Card, CardState, Cefr } from "@/types/entities";

const STATE_LABEL: Record<CardState, string> = { 0: "Mới", 1: "Đang học", 2: "Đã thuộc", 3: "Học lại" };

export function CardList({ deckId, onEdit }: { deckId: string; onEdit: (c: Card) => void }) {
  const mounted = useDbMounted();
  const push = useToasts((s) => s.push);
  const [q, setQ] = useState("");
  const [stateF, setStateF] = useState<"all" | CardState>("all");
  const [cefrF, setCefrF] = useState<"all" | Cefr>("all");
  const [tagF, setTagF] = useState("all");
  const [dueOnly, setDueOnly] = useState(false);
  const [leechOnly, setLeechOnly] = useState(false);
  const [showSuspended, setShowSuspended] = useState(false);
  const [sort, setSort] = useState<"new" | "az" | "due">("new");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moveTo, setMoveTo] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const data = useLiveQuery(async () => {
    if (!mounted) return { cards: [], decks: [], tags: [] as string[] };
    const db = getDb();
    const [cards, decks] = await Promise.all([
      db.cards.where("deckId").equals(deckId).toArray(),
      db.decks.toArray(),
    ]);
    const tags = [...new Set(cards.flatMap((c) => c.tags))].sort();
    return { cards: cards.filter((c) => c.deletedAt == null), decks: decks.filter((d) => d.deletedAt == null), tags };
  }, [mounted, deckId]);

  const rows = useMemo(() => {
    const now = Date.now();
    let list = (data?.cards ?? []).filter((c) => (showSuspended ? true : !c.suspended));
    if (stateF !== "all") list = list.filter((c) => c.state === stateF);
    if (cefrF !== "all") list = list.filter((c) => c.cefr === cefrF);
    if (tagF !== "all") list = list.filter((c) => c.tags.includes(tagF));
    if (dueOnly) list = list.filter((c) => c.due <= now && !c.suspended);
    if (leechOnly) list = list.filter((c) => c.leech);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.word.toLowerCase().includes(s) ||
          c.meaningVi.some((m) => m.toLowerCase().includes(s)) ||
          c.tags.some((t) => t.toLowerCase().includes(s)),
      );
    }
    const sorted = [...list];
    if (sort === "az") sorted.sort((a, b) => a.word.localeCompare(b.word));
    else if (sort === "due") sorted.sort((a, b) => a.due - b.due);
    else sorted.sort((a, b) => b.createdAt - a.createdAt);
    return sorted;
  }, [data, q, stateF, cefrF, tagF, dueOnly, leechOnly, showSuspended, sort]);

  const virtual = useVirtualizer({ count: rows.length, getScrollElement: () => parentRef.current, estimateSize: () => 92, overscan: 8 });

  function toggle(id: string): void {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function bulkDelete(): Promise<void> {
    const db = getDb();
    const ids = [...selected];
    const backup = await db.cards.where("id").anyOf(ids).toArray();
    await db.cards.where("id").anyOf(ids).modify({ deletedAt: Date.now(), updatedAt: Date.now() });
    setSelected(new Set());
    push(`Đã xóa ${ids.length} thẻ.`, () => {
      void (async () => {
        for (const c of backup) await db.cards.put({ ...c, deletedAt: null, updatedAt: Date.now() });
      })();
    });
  }

  async function bulkSuspend(s: boolean): Promise<void> {
    const db = getDb();
    await db.cards.where("id").anyOf([...selected]).modify({ suspended: s, updatedAt: Date.now() });
    setSelected(new Set());
    push(s ? "Đã tạm ẩn các thẻ đã chọn." : "Đã bỏ ẩn.");
  }

  async function bulkMove(): Promise<void> {
    if (!moveTo) return;
    const db = getDb();
    await db.cards.where("id").anyOf([...selected]).modify({ deckId: moveTo, updatedAt: Date.now() });
    setSelected(new Set());
    push("Đã chuyển thẻ sang bộ khác.");
  }

  if (!mounted) return <div aria-busy="true" className="h-32 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />;

  return (
    <div className="mt-4">
      <div className="grid gap-2 md:grid-cols-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm từ / nghĩa / tag…"
          aria-label="Tìm thẻ"
          className="min-h-[44px] rounded-xl border border-stone-300 px-3 md:col-span-2 dark:border-stone-700 dark:bg-stone-950"
        />
        <select value={typeof stateF === "number" ? String(stateF) : "all"} onChange={(e) => setStateF(e.target.value === "all" ? "all" : (Number(e.target.value) as CardState))} aria-label="Lọc trạng thái" className="min-h-[44px] rounded-xl border px-2 dark:border-stone-700 dark:bg-stone-950">
          <option value="all">Mọi trạng thái</option>
          <option value="0">Mới</option>
          <option value="1">Đang học</option>
          <option value="2">Đã thuộc</option>
          <option value="3">Học lại</option>
        </select>
        <select value={cefrF} onChange={(e) => setCefrF(e.target.value as "all" | Cefr)} aria-label="Lọc CEFR" className="min-h-[44px] rounded-xl border px-2 dark:border-stone-700 dark:bg-stone-950">
          <option value="all">Mọi CEFR</option>
          {["A1", "A2", "B1", "B2", "C1", "C2"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={tagF} onChange={(e) => setTagF(e.target.value)} aria-label="Lọc tag" className="min-h-[44px] rounded-xl border px-2 dark:border-stone-700 dark:bg-stone-950">
          <option value="all">Mọi tag</option>
          {(data?.tags ?? []).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "az" | "due")} aria-label="Sắp xếp" className="min-h-[44px] rounded-xl border px-2 dark:border-stone-700 dark:bg-stone-950">
          <option value="new">Mới nhất</option>
          <option value="az">A → Z</option>
          <option value="due">Đến hạn trước</option>
        </select>
        <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} /> Đến hạn</label>
        <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={leechOnly} onChange={(e) => setLeechOnly(e.target.checked)} /> Leech</label>
        <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={showSuspended} onChange={(e) => setShowSuspended(e.target.checked)} /> Hiện thẻ ẩn</label>
      </div>

      {selected.size > 0 ? (
        <div role="toolbar" aria-label="Thao tác hàng loạt" className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl bg-stone-900 p-2 text-white dark:bg-white dark:text-stone-900">
          <span className="px-2 text-sm font-bold">{selected.size} đã chọn</span>
          <button type="button" onClick={() => void bulkSuspend(true)} className="min-h-[40px] rounded-xl bg-white/20 px-3 text-xs font-bold">Tạm ẩn</button>
          <button type="button" onClick={() => void bulkSuspend(false)} className="min-h-[40px] rounded-xl bg-white/20 px-3 text-xs font-bold">Bỏ ẩn</button>
          <button type="button" onClick={() => void resetCardProgress(getDb(), [...selected]).then(() => { setSelected(new Set()); push("Đã reset tiến độ."); })} className="min-h-[40px] rounded-xl bg-white/20 px-3 text-xs font-bold">Reset tiến độ</button>
          <button type="button" onClick={() => void bulkDelete()} className="flex min-h-[40px] items-center gap-1 rounded-xl bg-red-600 px-3 text-xs font-bold text-white"><Trash2 size={14} aria-hidden /> Xóa</button>
          <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} aria-label="Chuyển sang bộ" className="min-h-[40px] rounded-xl px-2 text-xs text-stone-900">
            <option value="">Chuyển sang…</option>
            {(data?.decks ?? []).filter((d) => d.id !== deckId).map((d) => (
              <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>
            ))}
          </select>
          {moveTo ? <button type="button" onClick={() => void bulkMove()} className="min-h-[40px] rounded-xl bg-white/20 px-3 text-xs font-bold">Chuyển</button> : null}
          <button type="button" onClick={() => setSelected(new Set())} className="min-h-[40px] px-2 text-xs underline">Bỏ chọn</button>
        </div>
      ) : null}

      <p className="mt-2 text-xs text-stone-500">{rows.length} thẻ {rows.length > 50 ? "(danh sách ảo hóa, cuộn để xem)" : ""}</p>
      <div ref={parentRef} className="mt-2 max-h-[520px] overflow-auto rounded-3xl border border-stone-200 dark:border-stone-800" tabIndex={0} aria-label="Danh sách thẻ">
        <div style={{ height: `${virtual.getTotalSize()}px`, position: "relative" }}>
          {virtual.getVirtualItems().map((v) => {
            const c = rows[v.index];
            if (!c) return null;
            return (
              <div key={c.id} style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${v.start}px)` }} className="p-1">
                <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm dark:bg-stone-900">
                  <input type="checkbox" aria-label={`Chọn ${c.word}`} checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="ml-1 size-5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{c.word} {c.leech ? <span className="rounded bg-red-100 px-1 text-[10px] text-red-700">LEECH</span> : null} {c.suspended ? <span className="rounded bg-stone-200 px-1 text-[10px]">ẨN</span> : null}</p>
                    <p className="truncate text-xs text-stone-500">{c.meaningVi.join("; ")} · {STATE_LABEL[c.state]} {c.cefr ? `· ${c.cefr}` : ""}</p>
                  </div>
                  <button type="button" aria-label={`Sửa ${c.word}`} onClick={() => onEdit(c)} className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border"><Pencil size={14} aria-hidden /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
