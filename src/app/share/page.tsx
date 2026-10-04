"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { createDeck, bulkCreateCards, newCardDefaults } from "@/lib/db/repositories";
import { decodeShare } from "@/lib/share/share";
import { useToasts } from "@/components/common/Toasts";

function Inner() {
  const sp = useSearchParams();
  const push = useToasts((s) => s.push);
  const [doneId, setDoneId] = useState<string | null>(null);

  const parsed = useMemo(() => {
    const d = sp.get("d") ?? "";
    if (!d) return { error: "Thiếu dữ liệu chia sẻ." as string | null, deck: null };
    try {
      return { error: null, deck: decodeShare(d) };
    } catch {
      return { error: "Link chia sẻ không hợp lệ hoặc đã hỏng.", deck: null };
    }
  }, [sp]);

  async function add(): Promise<void> {
    if (!parsed.deck) return;
    const db = getDb();
    const deck = await createDeck(db, {
      name: parsed.deck.name,
      description: parsed.deck.description ?? "Deck được chia sẻ",
      emoji: parsed.deck.emoji ?? "🎁",
      color: "coral",
      tags: ["shared"],
      archived: false,
    });
    await bulkCreateCards(
      db,
      parsed.deck.cards.map((c) => ({
        ...newCardDefaults(deck.id, c.word, c.meaningVi),
        pos: c.pos ?? [],
        examples: c.exampleEn ? [{ en: c.exampleEn, vi: c.exampleVi }] : [],
      })),
    );
    setDoneId(deck.id);
    push(`Đã thêm “${deck.name}” vào thư viện.`);
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-extrabold">Nhận deck được chia sẻ 🎁</h1>
      {parsed.error ? (
        <p role="alert" className="mt-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{parsed.error}</p>
      ) : parsed.deck ? (
        <div className="mt-3 rounded-3xl bg-white p-5 shadow-card dark:bg-stone-900">
          <p className="text-xl font-extrabold">{parsed.deck.emoji} {parsed.deck.name}</p>
          <p className="text-sm text-stone-500">{parsed.deck.cards.length} thẻ · xem trước 5 thẻ đầu:</p>
          <ul className="mt-2 text-sm">
            {parsed.deck.cards.slice(0, 5).map((c) => (
              <li key={c.word}>• {c.word} — {c.meaningVi.join("; ")}</li>
            ))}
          </ul>
          {doneId ? (
            <Link href={`/decks/${doneId}`} className="mt-3 flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white">
              Mở deck vừa thêm →
            </Link>
          ) : (
            <button type="button" onClick={() => void add()} className="mt-3 min-h-[48px] w-full rounded-2xl bg-orange-500 font-bold text-white">
              Thêm vào thư viện của tôi
            </button>
          )}
        </div>
      ) : null}
    </main>
  );
}

export default function SharePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
