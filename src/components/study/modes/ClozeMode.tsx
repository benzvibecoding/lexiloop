"use client";

import { useMemo, useState } from "react";
import { gradeCardInDb } from "@/lib/study/gradeAndLog";
import { gradeTyping, makeCloze } from "@/lib/study/modes";
import { useModeQueue } from "@/components/study/modes/useQueue";

/** Cloze: điền từ vào câu ví dụ. */
export function ClozeMode({ deckId }: { deckId: string | null }) {
  const { queue, setQueue, deckName } = useModeQueue(deckId);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const current = queue?.[idx]?.card ?? null;
  const cloze = useMemo(() => (current ? makeCloze(current) : null), [current]);

  if (!queue) return <div aria-busy="true" className="h-48 animate-pulse rounded-3xl bg-stone-200" />;
  if (queue.length === 0 || !current || !cloze) return <p className="p-4 text-center font-bold">Hết thẻ hôm nay! 🎉</p>;

  async function check(): Promise<void> {
    if (!current || !queue || !cloze) return;
    const v = gradeTyping(cloze.answer, typed);
    setChecked(true);
    await gradeCardInDb(current, v.rating, "cloze", 12000);
    window.setTimeout(() => {
      setQueue((q) => (q ?? []).filter((_, i) => i !== idx));
      setTyped("");
      setChecked(false);
      if (idx >= (queue?.length ?? 1) - 1) setIdx(0);
    }, 900);
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-bold">{deckName} · Cloze · còn {queue.length - idx}</p>
      <div className="mt-3 rounded-3xl bg-white p-5 shadow-card dark:bg-stone-900">
        <p className="text-sm text-stone-500">Điền từ thích hợp (gợi ý: {cloze.hintVi})</p>
        <p className="mt-2 text-lg">…{cloze.before}<span className="mx-1 rounded bg-amber-200 px-2">___</span>{cloze.after}</p>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void check(); }} placeholder="điền từ…" aria-label="Từ cần điền" className="mt-3 min-h-[48px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950" />
        <button type="button" onClick={() => void check()} className="mt-3 min-h-[48px] w-full rounded-2xl bg-orange-500 font-bold text-white">Kiểm tra</button>
        {checked ? <p role="status" className="mt-2 text-sm">Đáp án: <b>{cloze.answer}</b></p> : null}
      </div>
    </div>
  );
}
