"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, Plus } from "lucide-react";
import { STARTER_DECKS, cloneStarterDeck } from "@/lib/library/starter";
import { getDb } from "@/lib/db/client";
import { useToasts } from "@/components/common/Toasts";
import { useDbMounted } from "@/stores/settings";

export default function LibraryPage() {
  const mounted = useDbMounted();
  const push = useToasts((s) => s.push);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState<string | null>(null);

  const owned = useLiveQuery(async () => {
    if (!mounted) return new Set<string>();
    const decks = await getDb().decks.toArray();
    const ids = new Set<string>();
    for (const d of decks) {
      if (d.deletedAt != null) continue;
      for (const t of d.tags) {
        if (t.startsWith("starter:")) ids.add(t.slice(8));
      }
    }
    return ids;
  }, [mounted]);

  const list = STARTER_DECKS.filter((d) =>
    q.trim() ? (d.name + d.description).toLowerCase().includes(q.trim().toLowerCase()) : true,
  );

  async function add(id: string): Promise<void> {
    setAdding(id);
    try {
      const r = await cloneStarterDeck(getDb(), id);
      push(`Đã thêm ${r.cards} thẻ vào thư viện của bạn.`);
    } catch (e) {
      push(e instanceof Error ? e.message : "Thêm thất bại.");
    } finally {
      setAdding(null);
    }
  }

  if (!mounted) return <div aria-busy="true" className="h-32 animate-pulse rounded-3xl bg-stone-200" />;

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Thư viện deck mẫu</h1>
      <p className="mt-1 text-sm text-stone-500">
        {STARTER_DECKS.length} deck · {STARTER_DECKS.reduce((a, d) => a + d.cards.length, 0)} thẻ tự biên. Một chạm để thêm vào bộ của bạn (không mất tiến độ cũ).
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm deck mẫu…"
        aria-label="Tìm deck mẫu"
        className="mt-3 min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
      />
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {list.map((d) => {
          const has = owned?.has(d.id) ?? false;
          return (
            <li key={d.id} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
              <p className="text-lg font-extrabold">{d.emoji} {d.name}</p>
              <p className="mt-1 text-sm text-stone-500">{d.description}</p>
              <p className="mt-1 text-xs text-stone-500">{d.cards.length} thẻ · trình độ {d.level}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={adding === d.id}
                  onClick={() => void add(d.id)}
                  className="flex min-h-[44px] items-center gap-1 rounded-2xl bg-orange-500 px-4 text-sm font-bold text-white disabled:opacity-50"
                >
                  {has ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
                  {adding === d.id ? "Đang thêm…" : has ? "Thêm nữa" : "Thêm vào của tôi"}
                </button>
                <Link href="/placement" className="flex min-h-[44px] items-center rounded-2xl border px-4 text-sm font-bold">
                  Test trình độ →
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
