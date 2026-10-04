import type { Card } from "@/types/entities";

export type QueueLimits = {
  newPerDay: number;
  reviewPerDay: number;
  deckNewDone?: Record<string, number>;
  deckReviewDone?: Record<string, number>;
};

export type QueueItem = {
  card: Card;
  kind: "learning" | "review" | "new";
};

function shuffle<T>(arr: T[], seedRandom: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seedRandom() * (i + 1));
    const t = a[i];
    a[i] = a[j] as T;
    a[j] = t as T;
  }
  return a;
}

/**
 * Thứ tự: learning/relearning đến hạn → review đến hạn → thẻ mới.
 * Bỏ qua: đã xóa, suspended, buried, chưa đến hạn (trừ thẻ mới).
 */
export function buildQueue(
  cards: Card[],
  nowMs: number,
  limits: QueueLimits,
  opts?: { shuffle?: boolean; interleave?: boolean },
): QueueItem[] {
  const alive = cards.filter(
    (c) => c.deletedAt == null && !c.suspended && (c.buriedUntil == null || c.buriedUntil <= nowMs),
  );
  const learning = alive
    .filter((c) => (c.state === 1 || c.state === 3) && c.due <= nowMs)
    .sort((a, b) => a.due - b.due)
    .map((card) => ({ card, kind: "learning" as const }));

  const reviewAll = alive
    .filter((c) => c.state === 2 && c.due <= nowMs)
    .sort((a, b) => a.due - b.due);

  const review = reviewAll
    .slice(0, Math.max(0, limits.reviewPerDay))
    .map((card) => ({ card, kind: "review" as const }));

  const fresh = alive
    .filter((c) => c.state === 0)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, Math.max(0, limits.newPerDay))
    .map((card) => ({ card, kind: "new" as const }));

  let tail: QueueItem[] = [...review, ...fresh];
  if (opts?.interleave && review.length > 0 && fresh.length > 0) {
    const mixed: QueueItem[] = [];
    const ri = [...review];
    const ni = [...fresh];
    while (ri.length > 0 || ni.length > 0) {
      const r = ri.shift();
      const n = ni.shift();
      if (r) mixed.push(r);
      if (n) mixed.push(n);
    }
    tail = mixed;
  } else if (opts?.shuffle) {
    tail = shuffle(tail);
  }
  return [...learning, ...tail];
}

export function countDue(cards: Card[], nowMs: number): { learning: number; review: number; fresh: number } {
  const alive = cards.filter(
    (c) => c.deletedAt == null && !c.suspended && (c.buriedUntil == null || c.buriedUntil <= nowMs),
  );
  return {
    learning: alive.filter((c) => (c.state === 1 || c.state === 3) && c.due <= nowMs).length,
    review: alive.filter((c) => c.state === 2 && c.due <= nowMs).length,
    fresh: alive.filter((c) => c.state === 0).length,
  };
}
