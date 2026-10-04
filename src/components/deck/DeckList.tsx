"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Archive, Copy, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { getDb } from "@/lib/db/client";
import { createDeck, updateDeck, softDeleteDeck } from "@/lib/db/repositories";
import { duplicateDeck } from "@/lib/deck/actions";
import { DeckForm, type DeckFormValues } from "@/components/deck/DeckForm";
import { useToasts } from "@/components/common/Toasts";
import { useDbMounted } from "@/stores/settings";

function parseTags(s: string): string[] {
  return s.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20);
}

export function DeckList() {
  const mounted = useDbMounted();
  const push = useToasts((s) => s.push);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const decks = useLiveQuery(async () => {
    if (!mounted) return [];
    const db = getDb();
    const all = await db.decks.toArray();
    const counts = await db.cards.toCollection().primaryKeys();
    void counts;
    return all
      .filter((d) => d.deletedAt == null)
      .filter((d) => (showArchived ? true : !d.archived))
      .filter((d) => (q ? (d.name + (d.description ?? "")).toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [mounted, q, showArchived]);

  const cardCounts = useLiveQuery(async () => {
    if (!mounted) return {} as Record<string, number>;
    const db = getDb();
    const cards = await db.cards.toArray();
    const m: Record<string, number> = {};
    for (const c of cards) {
      if (c.deletedAt != null) continue;
      m[c.deckId] = (m[c.deckId] ?? 0) + 1;
    }
    return m;
  }, [mounted]);

  const editing = useMemo(() => decks?.find((d) => d.id === editingId) ?? null, [decks, editingId]);

  async function onCreate(v: DeckFormValues): Promise<void> {
    const db = getDb();
    await createDeck(db, {
      name: v.name.trim(),
      description: v.description?.trim() || undefined,
      emoji: v.emoji,
      color: v.color,
      tags: parseTags(v.tags),
      archived: false,
    });
    setCreating(false);
    push("Đã tạo bộ thẻ mới.");
  }

  async function onEdit(v: DeckFormValues): Promise<void> {
    if (!editing) return;
    const db = getDb();
    await updateDeck(db, editing.id, {
      name: v.name.trim(),
      description: v.description?.trim() || undefined,
      emoji: v.emoji,
      color: v.color,
      tags: parseTags(v.tags),
    });
    setEditingId(null);
    push("Đã lưu bộ thẻ.");
  }

  async function onDelete(id: string, name: string): Promise<void> {
    const db = getDb();
    const deck = await db.decks.get(id);
    const cards = await db.cards.where("deckId").equals(id).toArray();
    await softDeleteDeck(db, id);
    push(`Đã xóa “${name}”.`, () => {
      void (async () => {
        if (!deck) return;
        await db.transaction("rw", [db.decks, db.cards], async () => {
          await db.decks.put({ ...deck, deletedAt: null, updatedAt: Date.now() });
          for (const c of cards) await db.cards.put({ ...c, deletedAt: null, updatedAt: Date.now() });
        });
      })();
    });
  }

  if (!mounted) return <div aria-busy="true" className="h-24 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-h-[44px] flex-1 items-center gap-2 rounded-2xl border border-stone-300 px-3 dark:border-stone-700">
          <Search size={16} aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm bộ thẻ…"
            aria-label="Tìm bộ thẻ"
            className="w-full bg-transparent outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          aria-pressed={showArchived}
          className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-stone-300 px-3 text-sm font-bold dark:border-stone-700"
        >
          <Archive size={16} aria-hidden /> {showArchived ? "Ẩn lưu trữ" : "Hiện lưu trữ"}
        </button>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="flex min-h-[44px] items-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-bold text-white"
        >
          <Plus size={16} aria-hidden /> Bộ thẻ mới
        </button>
      </div>

      {creating ? (
        <div className="mt-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <DeckForm onSubmit={(v) => void onCreate(v)} submitLabel="Tạo bộ thẻ" />
        </div>
      ) : null}

      {editing ? (
        <div className="mt-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <h2 className="mb-2 font-bold">Sửa: {editing.name}</h2>
          <DeckForm
            initial={{ name: editing.name, description: editing.description ?? "", emoji: editing.emoji, color: editing.color, tags: editing.tags.join(", ") }}
            onSubmit={(v) => void onEdit(v)}
            submitLabel="Lưu"
          />
          <button type="button" onClick={() => setEditingId(null)} className="mt-2 text-sm underline">
            Hủy
          </button>
        </div>
      ) : null}

      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {(decks ?? []).map((d) => (
          <li key={d.id} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/decks/${d.id}`} className="flex items-center gap-2 text-lg font-extrabold">
                <span aria-hidden>{d.emoji}</span> {d.name}
              </Link>
              {d.archived ? <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold">Lưu trữ</span> : null}
            </div>
            {d.description ? <p className="mt-1 text-sm text-stone-500">{d.description}</p> : null}
            <p className="mt-1 text-xs text-stone-500">
              {cardCounts?.[d.id] ?? 0} thẻ · {d.tags.join(", ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/decks/${d.id}`} className="flex min-h-[40px] items-center rounded-xl bg-stone-900 px-3 text-xs font-bold text-white dark:bg-white dark:text-stone-900">
                Mở
              </Link>
              <button type="button" aria-label={`Sửa ${d.name}`} onClick={() => setEditingId(d.id)} className="flex min-h-[40px] items-center gap-1 rounded-xl border px-3 text-xs font-bold">
                <Pencil size={14} aria-hidden /> Sửa
              </button>
              <button
                type="button"
                onClick={() => void duplicateDeck(getDb(), d.id).then(() => push("Đã nhân bản bộ thẻ."))}
                className="flex min-h-[40px] items-center gap-1 rounded-xl border px-3 text-xs font-bold"
              >
                <Copy size={14} aria-hidden /> Nhân bản
              </button>
              <button
                type="button"
                onClick={() => void updateDeck(getDb(), d.id, { archived: !d.archived })}
                className="flex min-h-[40px] items-center gap-1 rounded-xl border px-3 text-xs font-bold"
              >
                <Archive size={14} aria-hidden /> {d.archived ? "Bỏ lưu trữ" : "Lưu trữ"}
              </button>
              <button
                type="button"
                aria-label={`Xóa ${d.name}`}
                onClick={() => void onDelete(d.id, d.name)}
                className="flex min-h-[40px] items-center gap-1 rounded-xl border border-red-300 px-3 text-xs font-bold text-red-600"
              >
                <Trash2 size={14} aria-hidden /> Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>
      {decks?.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700">
          <p className="text-4xl" aria-hidden>📭</p>
          <p className="mt-2 font-bold">Chưa có bộ thẻ nào</p>
          <p className="text-sm text-stone-500">Bấm “Bộ thẻ mới” để tạo deck đầu tiên.</p>
        </div>
      ) : null}
    </div>
  );
}
