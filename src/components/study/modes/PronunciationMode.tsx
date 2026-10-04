"use client";
/* eslint-disable react-hooks/set-state-in-effect -- recognizer setup syncs external Speech API. */

import { useEffect, useState } from "react";
import { gradeCardInDb } from "@/lib/study/gradeAndLog";
import { pronunciationRating, similarity } from "@/lib/study/modes";
import { useModeQueue } from "@/components/study/modes/useQueue";

type Rec = {
  start: () => void;
  stop: () => void;
  supported: boolean;
};

/** Nhận diện hỗ trợ: webkitSpeechRecognition / SpeechRecognition. Một số trình duyệt gửi audio lên server. */
function useRecognizer(lang = "en-US", onResult: (text: string) => void): Rec {
  const [rec, setRec] = useState<{ start: () => void; stop: () => void } | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => { lang: string; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; start: () => void; stop: () => void };
      webkitSpeechRecognition?: new () => { lang: string; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; start: () => void; stop: () => void };
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    try {
      const r = new Ctor();
      r.lang = lang;
      r.onresult = (e) => {
        const t = e.results[0]?.[0]?.transcript ?? "";
        if (t) onResult(t);
      };
      setRec({ start: () => { try { r.start(); } catch { /* noop */ } }, stop: () => { try { r.stop(); } catch { /* noop */ } } });
      setSupported(true);
    } catch {
      setSupported(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return { start: () => rec?.start(), stop: () => rec?.stop(), supported };
}

/** Pronunciation: đọc to, máy chấm độ giống. Ẩn khi trình duyệt không hỗ trợ. */
export function PronunciationMode({ deckId }: { deckId: string | null }) {
  const { queue, setQueue, deckName } = useModeQueue(deckId);
  const [idx, setIdx] = useState(0);
  const [heard, setHeard] = useState("");
  const [listening, setListening] = useState(false);
  const current = queue?.[idx]?.card ?? null;
  const rec = useRecognizer("en-US", (t) => {
    setHeard(t);
    setListening(false);
  });

  if (!queue) return <div aria-busy="true" className="h-48 animate-pulse rounded-3xl bg-stone-200" />;
  if (!rec.supported) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 text-center shadow-card dark:bg-stone-900">
        <p className="text-4xl" aria-hidden>🎙️</p>
        <h2 className="mt-2 font-extrabold">Trình duyệt chưa hỗ trợ chấm phát âm</h2>
        <p className="mt-1 text-sm text-stone-500">Chế độ này cần Web Speech API (Chrome/Edge trên HTTPS hoặc localhost). Lưu ý: một số trình duyệt gửi âm thanh lên server nhận dạng giọng nói.</p>
      </div>
    );
  }
  if (queue.length === 0 || !current) return <p className="p-4 text-center font-bold">Hết thẻ hôm nay! 🎉</p>;

  const sim = heard ? similarity(current.word, heard) : 0;

  async function grade(): Promise<void> {
    if (!current || !queue) return;
    const r = pronunciationRating(sim);
    await gradeCardInDb(current, r, "pronunciation", 15000);
    setQueue((q) => (q ?? []).filter((_, i) => i !== idx));
    setHeard("");
    if (idx >= (queue?.length ?? 1) - 1) setIdx(0);
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-bold">{deckName} · Pronunciation</p>
      <div className="mt-3 rounded-3xl bg-white p-6 text-center shadow-card dark:bg-stone-900">
        <p className="text-sm text-stone-500">Đọc to từ này</p>
        <p className="text-4xl font-extrabold">{current.word}</p>
        <p className="mt-1 text-sm text-stone-500">{current.meaningVi.join("; ")}</p>
        <p className="mt-2 text-xs text-amber-700">⚠️ Âm thanh có thể được gửi lên server nhận dạng của trình duyệt.</p>
        <div className="mt-3 flex justify-center gap-2">
          {!listening ? (
            <button type="button" onClick={() => { setHeard(""); rec.start(); setListening(true); }} className="min-h-[52px] rounded-2xl bg-red-500 px-6 font-bold text-white">🎙️ Bấm để nói</button>
          ) : (
            <button type="button" onClick={() => { rec.stop(); setListening(false); }} className="min-h-[52px] rounded-2xl border px-6 font-bold">Dừng</button>
          )}
        </div>
        {heard ? (
          <div className="mt-3">
            <p role="status" aria-live="polite" className="text-sm">Máy nghe: “{heard}” · giống {Math.round(sim * 100)}%</p>
            <button type="button" onClick={() => void grade()} className="mt-2 min-h-[48px] w-full rounded-2xl bg-orange-500 font-bold text-white">Chấm & tiếp →</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
