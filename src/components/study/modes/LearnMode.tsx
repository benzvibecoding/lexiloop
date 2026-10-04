"use client";

import { useMemo, useState } from "react";
import { gradeCardInDb } from "@/lib/study/gradeAndLog";
import { buildQuizOptions, gradeTyping } from "@/lib/study/modes";
import { speak } from "@/lib/tts/speak";
import { useModeQueue } from "@/components/study/modes/useQueue";

/** Learn: giới thiệu → trắc nghiệm → gõ lại → hoàn tất (mỗi thẻ ghi 1 ReviewLog mode=learn). */
export function LearnMode({ deckId }: { deckId: string | null }) {
  const { queue, pool, deckName } = useModeQueue(deckId);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState<"intro" | "quiz" | "type" | "done">("intro");
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(0);

  const current = queue?.[idx]?.card ?? null;
  const options = useMemo(() => (current ? buildQuizOptions(current, pool) : []), [current, pool]);
  const quizOk = picked != null && current != null && picked === current.id;

  if (!queue) return <div aria-busy="true" className="h-48 animate-pulse rounded-3xl bg-stone-200" />;
  if (queue.length === 0) return <p className="p-4 text-center font-bold">Hết thẻ hôm nay! 🎉</p>;
  if (!current) return null;

  async function finishType(): Promise<void> {
    if (!current || !queue) return;
    const v = gradeTyping(current.word, typed);
    const rating = step === "type" && !quizOk ? 1 : v.rating;
    await gradeCardInDb(current, rating, "learn", 20000);
    setDone((d) => d + 1);
    setPicked(null);
    setTyped("");
    if (idx + 1 >= queue.length) setStep("done");
    else {
      setIdx((i) => i + 1);
      setStep("intro");
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-bold">{deckName} · Learn · {idx + 1}/{queue.length} · xong {done}</p>
      {step === "intro" ? (
        <div className="mt-3 rounded-3xl bg-white p-6 text-center shadow-card dark:bg-stone-900">
          <p className="text-sm text-stone-500">Thẻ mới — ghi nhớ rồi bấm tiếp tục</p>
          <p className="mt-2 text-4xl font-extrabold">{current.word}</p>
          <p className="mt-1 font-bold">{current.meaningVi.join("; ")}</p>
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => speak(current.word, { rate: 0.9 })} className="min-h-[44px] rounded-xl border px-4 text-sm font-bold">🔊 Nghe</button>
            <button type="button" onClick={() => setStep("quiz")} className="min-h-[44px] rounded-2xl bg-orange-500 px-6 text-sm font-bold text-white">Tiếp tục →</button>
          </div>
        </div>
      ) : null}
      {step === "quiz" ? (
        <div className="mt-3 rounded-3xl bg-white p-5 shadow-card dark:bg-stone-900">
          <p className="font-bold">“{current.word}” nghĩa là gì?</p>
          <div className="mt-3 grid gap-2">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setPicked(o.id)}
                aria-pressed={picked === o.id}
                className={`min-h-[48px] rounded-2xl border px-4 text-left text-sm font-medium ${picked === o.id ? "border-orange-500 bg-orange-50 dark:bg-orange-950" : ""}`}
              >
                {o.meaningVi.join("; ")}
              </button>
            ))}
          </div>
          <button type="button" disabled={picked == null} onClick={() => setStep("type")} className="mt-3 min-h-[48px] w-full rounded-2xl bg-stone-900 font-bold text-white disabled:opacity-40 dark:bg-white dark:text-stone-900">
            {quizOk ? "Đúng rồi! Gõ lại để nhớ →" : picked ? "Chưa đúng — gõ lại để nhớ →" : "Chọn đáp án trước"}
          </button>
        </div>
      ) : null}
      {step === "type" ? (
        <div className="mt-3 rounded-3xl bg-white p-5 shadow-card dark:bg-stone-900">
          <p className="font-bold">Gõ lại từ theo nghĩa: {current.meaningVi.join("; ")}</p>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="gõ từ…" aria-label="Gõ lại từ" className="mt-2 min-h-[48px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950" />
          <button type="button" onClick={() => void finishType()} className="mt-3 min-h-[48px] w-full rounded-2xl bg-emerald-600 font-bold text-white">Hoàn tất thẻ này</button>
        </div>
      ) : null}
      {step === "done" ? <p className="mt-4 text-center font-extrabold">Xong {queue.length} thẻ Learn! 🎉</p> : null}
    </div>
  );
}
