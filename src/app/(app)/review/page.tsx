"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db/client";
import { peekSettings } from "@/lib/db/repositories";
import { buildQueue, countDue } from "@/lib/srs/queue";
import { useDbMounted, useInitSettings } from "@/stores/settings";

export default function ReviewPage() {
  const mounted = useDbMounted();
  useInitSettings();
  const data = useLiveQuery(async () => {
    if (!mounted) return null;
    const db = getDb();
    const settings = await peekSettings(db);
    const [decks, cards] = await Promise.all([db.decks.toArray(), db.cards.toArray()]);
    const aliveDecks = decks.filter((d) => d.deletedAt == null && !d.archived);
    const aliveCards = cards.filter((c) => c.deletedAt == null);
    const now = Date.now();
    const total = countDue(aliveCards, now);
    const perDeck = aliveDecks.map((d) => {
      const mine = aliveCards.filter((c) => c.deckId === d.id);
      const q = buildQueue(mine, now, { newPerDay: settings.newPerDay, reviewPerDay: settings.reviewPerDay });
      return { deck: d, due: countDue(mine, now), queueLen: q.length };
    });
    const allQueue = buildQueue(aliveCards, now, { newPerDay: settings.newPerDay, reviewPerDay: settings.reviewPerDay });
    return { total, perDeck, allLen: allQueue.length };
  }, [mounted]);

  if (!mounted || !data) {
    return <div aria-busy="true" className="h-32 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Ôn tập hôm nay</h1>
      <p className="mt-1 text-sm text-stone-500">
        {data.total.learning} learning đến hạn · {data.total.review} review đến hạn · {data.total.fresh} thẻ mới
      </p>
      <Link href="/study" className="mt-4 flex min-h-[52px] items-center justify-center rounded-2xl bg-orange-500 px-6 font-bold text-white">
        Bắt đầu ôn {data.allLen} thẻ →
      </Link>
      <ul className="mt-4 grid gap-2">
        {data.perDeck.map(({ deck, due, queueLen }) => (
          <li key={deck.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white p-3 shadow-sm dark:bg-stone-900">
            <span className="font-bold">{deck.emoji} {deck.name}</span>
            <span className="text-xs text-stone-500">{due.learning + due.review + Math.min(due.fresh, queueLen)} thẻ · </span>
            <Link href={`/study?deck=${deck.id}`} className="flex min-h-[40px] items-center rounded-xl bg-stone-900 px-3 text-xs font-bold text-white dark:bg-white dark:text-stone-900">
              Học {queueLen}
            </Link>
          </li>
        ))}
      </ul>
      {data.perDeck.length === 0 ? (
        <p className="mt-4 text-sm">Chưa có bộ nào. <Link href="/decks" className="underline">Tạo deck trước →</Link></p>
      ) : null}
    </div>
  );
}
