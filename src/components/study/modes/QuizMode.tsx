"use client";

import { useMemo, useState } from "react";
import { gradeCardInDb } from "@/lib/study/gradeAndLog";
import { buildQuizOptions } from "@/lib/study/modes";
import { useModeQueue } from "@/components/study/modes/useQueue";

/** Trắc nghiệm với đáp án nhiễu thông minh. Đúng = Good, sai = Again. */
export function QuizMode({ deckId }: { deckId: string | null }) {
  const { queue, setQueue, pool, deckName } = useModeQueue(deckId);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const current = queue?.[idx]?.card ?? null;
  const options = useMemo(() => (current ? buildQuizOptions(current, pool) : []), [current, pool]);

  if (!queue) return <div aria-busy="true" className="h-48 animate-pulse rounded-3xl bg-stone-200" />;
  if (queue.length === 0) return <p className="p-4 text-center font-bold">Hết thẻ hôm nay! 🎉 (đúng {correct}/{done})</p>;
  if (!current) return null;

  async function answer(id: string): Promise<void> {
    if (picked || !current || !queue) return;
    setPicked(id);
    const ok = id === current.id;
    await gradeCardInDb(current, ok ? 3 : 1, "quiz", 10000);
    setDone((d) => d + 1);
    if (ok) setCorrect((c) => c + 1);
    window.setTimeout(() => {
      setQueue((q) => (q ?? []).filter((_, i) => i !== idx));
      setPicked(null);
      if (idx >= (queue?.length ?? 1) - 1) setIdx(0);
    }, 700);
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-bold">{deckName} · Quiz · còn {queue.length - idx} · đúng {correct}/{done}</p>
      <div className="mt-3 rounded-3xl bg-white p-5 shadow-card dark:bg-stone-900">
        <p className="text-sm text-stone-500">Chọn nghĩa đúng của</p>
        <p className="text-3xl font-extrabold">{current.word}</p>
        <div className="mt-3 grid gap-2" role="radiogroup" aria-label={`Nghĩa của ${current.word}`}>
          {options.map((o) => {
            const isRight = o.id === current.id;
            const isPick = picked === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => void answer(o.id)}
                aria-pressed={isPick}
                className={`min-h-[52px] rounded-2xl border px-4 text-left text-sm font-medium ${picked && isRight ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : ""} ${isPick && !isRight ? "border-red-500 bg-red-50 dark:bg-red-950" : ""}`}
              >
                {o.meaningVi.join("; ")}
              </button>
            );
          })}
        </div>
        {picked ? <p role="status" className="mt-2 text-sm">{picked === current.id ? "✅ Đúng!" : `❌ Sai. Đáp án: ${current.meaningVi.join("; ")}`}</p> : null}
      </div>
    </div>
  );
}
