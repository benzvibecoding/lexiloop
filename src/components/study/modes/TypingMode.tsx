"use client";
/* eslint-disable react-hooks/set-state-in-effect -- timer tick + per-card input reset with TTS side effect. */

import { useEffect, useState } from "react";
import { gradeCardInDb } from "@/lib/study/gradeAndLog";
import { diffChars, gradeTyping } from "@/lib/study/modes";
import { speak } from "@/lib/tts/speak";
import { useModeQueue } from "@/components/study/modes/useQueue";
import { getDb } from "@/lib/db/client";
import { loadSettings } from "@/lib/db/repositories";

/** Typing + Listening (nghe rồi gõ). Tùy chọn bỏ qua lỗi nhỏ (mặc định bật). */
export function TypingMode({ deckId, listening = false }: { deckId: string | null; listening?: boolean }) {
  const { queue, setQueue, deckName, reload } = useModeQueue(deckId);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState<ReturnType<typeof gradeTyping> | null>(null);
  const [rate, setRate] = useState(1);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const current = queue?.[idx]?.card ?? null;

  useEffect(() => {
    setTyped("");
    setChecked(null);
    if (current && listening) {
      const word = current.word;
      void loadSettings(getDb()).then((s) => speak(word, { rate: s.ttsRate })).catch(() => undefined);
    }
  }, [current, listening]);

  if (!queue) return <div aria-busy="true" className="h-48 animate-pulse rounded-3xl bg-stone-200" />;
  if (queue.length === 0) return <p className="p-4 text-center font-bold">Hết thẻ hôm nay! 🎉</p>;
  if (!current) return null;

  async function check(): Promise<void> {
    if (!current) return;
    const v = gradeTyping(current.word, typed);
    setChecked(v);
  }

  async function next(ok: boolean): Promise<void> {
    if (!current || !queue) return;
    const v = checked ?? gradeTyping(current.word, typed);
    await gradeCardInDb(current, v.rating, listening ? "listening" : "typing", 15000);
    setCorrect((c) => c + (v.rating >= 2 ? 1 : 0));
    setDone((d) => d + 1);
    setQueue((q) => (q ?? []).filter((_, i) => i !== idx));
    void reload;
    if (idx >= (queue?.length ?? 1) - 1) setIdx(0);
    setTyped("");
    setChecked(null);
    void ok;
  }

  const diff = checked ? diffChars(current.word, typed) : [];

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-bold">{deckName} · {listening ? "Listening" : "Typing"} · còn {queue.length - idx} · đúng {correct}/{done}</p>
      <div className="mt-3 rounded-3xl bg-white p-5 shadow-card dark:bg-stone-900">
        {listening ? (
          <div>
            <p className="font-bold">Nghe và gõ lại từ</p>
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => speak(current.word, { rate })} className="min-h-[48px] rounded-2xl bg-stone-900 px-5 font-bold text-white dark:bg-white dark:text-stone-900">🔊 Nghe lại</button>
              <label className="text-xs">Tốc độ
                <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="ml-1 rounded border px-1 py-2">
                  {[0.6, 0.8, 1, 1.2].map((r) => (<option key={r} value={r}>{r}x</option>))}
                </select>
              </label>
            </div>
            <p className="mt-2 text-sm text-stone-500">Nghĩa: {current.meaningVi.join("; ")}</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-stone-500">Gõ từ theo nghĩa</p>
            <p className="text-2xl font-extrabold">{current.meaningVi.join("; ")}</p>
            {current.examples[0] ? <p className="mt-1 text-sm italic">“{current.examples[0].en}”</p> : null}
          </div>
        )}
        <input value={typed} onChange={(e) => { setTyped(e.target.value); setChecked(null); }} onKeyDown={(e) => { if (e.key === "Enter" && !checked) void check(); }} placeholder="gõ đáp án…" aria-label="Đáp án gõ" className="mt-3 min-h-[48px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950" />
        {checked ? (
          <div role="status" className="mt-2">
            <p className="font-mono text-lg">
              {diff.map((d, i) => (
                <span key={i} className={d.ok ? "text-emerald-600" : "bg-red-200 text-red-800"}>{d.ch}</span>
              ))}
            </p>
            <p className="text-sm">{checked.kind === "exact" ? "✅ Đúng tuyệt đối!" : checked.kind === "close" ? "🟡 Gần đúng (bỏ qua lỗi nhỏ)." : `❌ Chưa đúng. Đáp án: ${current.word}`}</p>
            <button type="button" onClick={() => void next(checked.rating >= 2)} className="mt-2 min-h-[48px] w-full rounded-2xl bg-orange-500 font-bold text-white">Thẻ tiếp theo →</button>
          </div>
        ) : (
          <button type="button" onClick={() => void check()} className="mt-3 min-h-[48px] w-full rounded-2xl bg-stone-900 font-bold text-white dark:bg-white dark:text-stone-900">Kiểm tra (Enter)</button>
        )}
      </div>
    </div>
  );
}
