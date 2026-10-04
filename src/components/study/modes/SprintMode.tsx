"use client";
/* eslint-disable react-hooks/set-state-in-effect -- 60s countdown timer. */

import { useEffect, useState } from "react";
import { gradeCardInDb } from "@/lib/study/gradeAndLog";
import { useModeQueue } from "@/components/study/modes/useQueue";

/** Sprint 60s: chấm nhanh Quên/Nhớ, combo nhân XP hiển thị. Mỗi thẻ ghi ReviewLog mode=sprint. */
export function SprintMode({ deckId }: { deckId: string | null }) {
  const { queue, setQueue, deckName } = useModeQueue(deckId);
  const [idx, setIdx] = useState(0);
  const [secs, setSecs] = useState(60);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const current = queue?.[idx]?.card ?? null;

  useEffect(() => {
    if (over) return;
    if (secs <= 0) {
      setOver(true);
      return;
    }
    const t = window.setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [secs, over]);

  if (!queue) return <div aria-busy="true" className="h-48 animate-pulse rounded-3xl bg-stone-200" />;
  if (queue.length === 0) return <p className="p-4 text-center font-bold">Chưa có thẻ để sprint.</p>;

  async function hit(ok: boolean): Promise<void> {
    if (over || !current) return;
    await gradeCardInDb(current, ok ? 3 : 1, "sprint", 4000);
    if (ok) {
      const c = combo + 1;
      setCombo(c);
      setBest((b) => Math.max(b, c));
      setScore((s) => s + 10 + Math.min(c, 10) * 2);
    } else {
      setCombo(0);
    }
    setQueue((q) => (q ?? []).filter((_, i) => i !== idx));
    if (idx >= (queue?.length ?? 1) - 1) setIdx(0);
  }

  if (over) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-2xl font-extrabold">Hết 60s! ⚡</h2>
        <p className="mt-2">Điểm: <b>{score}</b> · combo cao nhất: <b>x{best}</b></p>
        <button type="button" onClick={() => { setSecs(60); setScore(0); setCombo(0); setBest(0); setOver(false); }} className="mt-3 min-h-[48px] rounded-2xl bg-orange-500 px-6 font-bold text-white">Chạy lại</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="font-bold">{deckName} · Sprint · ⏱ {secs}s · 🔥x{combo} · {score}đ</p>
      <div className="mt-3 rounded-3xl bg-white p-8 shadow-card dark:bg-stone-900">
        <p className="text-4xl font-extrabold">{current?.word}</p>
        <p className="mt-1 font-bold">{current?.meaningVi.join("; ")}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void hit(false)} className="min-h-[64px] rounded-2xl bg-red-500 text-xl font-extrabold text-white">✖ Quên</button>
        <button type="button" onClick={() => void hit(true)} className="min-h-[64px] rounded-2xl bg-emerald-500 text-xl font-extrabold text-white">✔ Nhớ</button>
      </div>
    </div>
  );
}
