"use client";
/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect -- wall-clock study mode. */

import { useEffect, useMemo, useState } from "react";
import { gradeCardInDb } from "@/lib/study/gradeAndLog";
import { makeMatchingPairs } from "@/lib/study/modes";
import { useModeQueue } from "@/components/study/modes/useQueue";
import { cn } from "@/lib/utils";

const BEST_KEY = "lexiloop-matching-best";

/** Matching: ghép cặp từ–nghĩa có bấm giờ, lưu kỷ lục (giây). Mỗi thẻ đúng ghi ReviewLog Good. */
export function MatchingMode({ deckId }: { deckId: string | null }) {
  const { queue, deckName } = useModeQueue(deckId);
  const [round, setRound] = useState(0);
  const [first, setFirst] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [startAt, setStartAt] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [best, setBest] = useState<number | null>(null);

  const cards = useMemo(() => (queue ?? []).slice(round * 8, round * 8 + 8).map((q) => q.card), [queue, round]);
  const pairs = useMemo(() => makeMatchingPairs(cards), [cards]);

  useEffect(() => {
    setMatched([]);
    setFirst(null);
    setStartAt(Date.now());
    try {
      const b = localStorage.getItem(BEST_KEY);
      setBest(b ? Number(b) : null);
    } catch {
      setBest(null);
    }
  }, [round, pairs.length]);

  useEffect(() => {
    if (!queue || matched.length >= pairs.length) return;
    const t = window.setInterval(() => setElapsed(Math.round((Date.now() - startAt) / 1000)), 500);
    return () => window.clearInterval(t);
  }, [queue, matched.length, pairs.length, startAt]);

  if (!queue) return <div aria-busy="true" className="h-48 animate-pulse rounded-3xl bg-stone-200" />;
  if (queue.length === 0) return <p className="p-4 text-center font-bold">Chưa có thẻ để ghép. Thêm thẻ trước nhé!</p>;

  const doneRound = matched.length === pairs.length && pairs.length > 0;

  async function tap(key: string, cardId: string): Promise<void> {
    if (matched.includes(key)) return;
    if (!first) {
      setFirst(key);
      return;
    }
    if (first === key) {
      setFirst(null);
      return;
    }
    const a = pairs.find((p) => p.key === first);
    const b = pairs.find((p) => p.key === key);
    if (a && b && a.cardId === b.cardId && a.kind !== b.kind) {
      setMatched((m) => [...m, first, key]);
      setFirst(null);
      const card = cards.find((c) => c.id === cardId);
      if (card) await gradeCardInDb(card, 3, "matching", 5000);
      if (matched.length + 2 >= pairs.length) {
        const secs = Math.round((Date.now() - startAt) / 1000);
        try {
          const prev = Number(localStorage.getItem(BEST_KEY) ?? "0");
          if (!prev || secs < prev) {
            localStorage.setItem(BEST_KEY, String(secs));
            setBest(secs);
          }
        } catch {
          // bỏ qua
        }
      }
    } else {
      setWrongKey(key);
      window.setTimeout(() => setWrongKey(null), 400);
      setFirst(null);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-bold">{deckName} · Matching · {elapsed}s {best ? `· kỷ lục ${best}s` : ""}</p>
      <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Ghép cặp từ và nghĩa">
        {pairs.map((p) => {
          const isMatched = matched.includes(p.key);
          const isFirst = first === p.key;
          return (
            <button
              key={p.key}
              type="button"
              disabled={isMatched}
              onClick={() => void tap(p.key, p.cardId)}
              className={cn(
                "min-h-[56px] rounded-2xl border px-3 text-sm font-bold",
                isMatched && "border-emerald-500 bg-emerald-100 opacity-50",
                isFirst && "border-orange-500 bg-orange-50",
                wrongKey === p.key && "border-red-500 bg-red-100",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {doneRound ? (
        <button type="button" onClick={() => setRound((r) => r + 1)} className="mt-3 min-h-[48px] w-full rounded-2xl bg-orange-500 font-bold text-white">
          Xong {elapsed}s! Vòng tiếp theo →
        </button>
      ) : null}
    </div>
  );
}
