"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Loader2, Plus } from "lucide-react";
import { getDb } from "@/lib/db/client";
import { createCard, newCardDefaults } from "@/lib/db/repositories";
import { fetchFreeDict, suggestMeaningVi } from "@/lib/dictionary/freeDict";
import { useToasts } from "@/components/common/Toasts";
import { useDbMounted } from "@/stores/settings";

export default function LookupPage() {
  const mounted = useDbMounted();
  const push = useToasts((s) => s.push);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Awaited<ReturnType<typeof fetchFreeDict>>>(null);
  const [vi, setVi] = useState<string[]>([]);
  const [deckId, setDeckId] = useState("");

  const decks = useLiveQuery(async () => {
    if (!mounted) return [];
    const all = await getDb().decks.toArray();
    return all.filter((d) => d.deletedAt == null && !d.archived);
  }, [mounted]);

  async function lookup(): Promise<void> {
    const w = q.trim();
    if (!w) return;
    setLoading(true);
    try {
      const [e, v] = await Promise.all([fetchFreeDict(w), suggestMeaningVi(w).catch(() => [] as string[])]);
      setEntry(e);
      setVi(v);
      if (!e) push("Không tìm thấy từ này trong từ điển.");
    } catch {
      push("Mất mạng hoặc hết quota — thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  async function addToDeck(): Promise<void> {
    const target = deckId || decks?.[0]?.id;
    if (!target || !entry) return;
    await createCard(getDb(), {
      ...newCardDefaults(target, entry.word, vi.length > 0 && vi[0] ? [vi[0] as string] : [entry.definitionEn || entry.word]),
      pos: entry.pos,
      ipaUs: entry.ipaUs || undefined,
      ipaUk: entry.ipaUk || undefined,
      audioUrl: entry.audioUrl || undefined,
      definitionEn: entry.definitionEn || undefined,
      examples: entry.examples,
      synonyms: entry.synonyms,
      antonyms: entry.antonyms,
    });
    push(`Đã thêm “${entry.word}” vào bộ.`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-extrabold">Tra từ</h1>
      <div className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void lookup(); }}
          placeholder="Nhập từ tiếng Anh…"
          aria-label="Từ cần tra"
          className="min-h-[48px] flex-1 rounded-2xl border border-stone-300 px-4 dark:border-stone-700 dark:bg-stone-950"
        />
        <button type="button" onClick={() => void lookup()} disabled={loading} className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-orange-500 px-5 font-bold text-white disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null} Tra
        </button>
      </div>

      {entry ? (
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900">
          <p className="text-3xl font-extrabold">{entry.word}</p>
          {entry.ipaUs ? <p className="font-ipa text-stone-500">{entry.ipaUs}</p> : null}
          {entry.pos.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.pos.map((p) => (
                <span key={p} className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">{p}</span>
              ))}
            </div>
          ) : null}
          {entry.definitionEn ? <p className="mt-2">{entry.definitionEn}</p> : null}
          {vi[0] ? <p className="mt-1 text-sm text-stone-500">Gợi ý máy dịch (kiểm tra lại): {vi[0]}</p> : null}
          {entry.examples[0] ? <p className="mt-2 text-sm italic">“{entry.examples[0].en}”</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={deckId || decks?.[0]?.id || ""} onChange={(e) => setDeckId(e.target.value)} aria-label="Chọn bộ để thêm" className="min-h-[44px] rounded-xl border px-2 text-sm dark:border-stone-700 dark:bg-stone-950">
              {(decks ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => void addToDeck()} disabled={(decks ?? []).length === 0} className="flex min-h-[44px] items-center gap-1 rounded-2xl bg-stone-900 px-4 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-stone-900">
              <Plus size={16} aria-hidden /> Thêm vào deck
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
