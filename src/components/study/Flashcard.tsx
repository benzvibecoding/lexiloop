"use client";

import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { speak, ttsSupported } from "@/lib/tts/speak";
import type { Card } from "@/types/entities";

const CEFR_COLOR: Record<string, string> = {
  A1: "bg-emerald-400",
  A2: "bg-emerald-500",
  B1: "bg-amber-400",
  B2: "bg-amber-500",
  C1: "bg-rose-400",
  C2: "bg-rose-500",
};

export function highlightWord(sentence: string, word: string): React.ReactNode {
  const idx = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (idx < 0 || !word) return sentence;
  return (
    <>
      {sentence.slice(0, idx)}
      <mark className="rounded bg-amber-300 px-0.5 text-stone-900">{sentence.slice(idx, idx + word.length)}</mark>
      {sentence.slice(idx + word.length)}
    </>
  );
}

export function Flashcard({
  card,
  flipped,
  onFlip,
  rate,
  autoplay = true,
}: {
  card: Card;
  flipped: boolean;
  onFlip: () => void;
  rate: number;
  autoplay?: boolean;
}) {
  function play(e?: React.MouseEvent): void {
    e?.stopPropagation();
    speak(card.word, { rate });
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        aria-label={flipped ? `Nghĩa của ${card.word}` : `Thẻ: ${card.word}. Bấm để lật.`}
        className={cn("card-3d block w-full text-left", flipped && "flipped")}
      >
        <span className="card-3d-inner relative block min-h-[300px] w-full md:min-h-[360px]">
          <span className="card-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white p-6 shadow-card dark:bg-stone-900">
            <span className="text-4xl font-extrabold tracking-tight md:text-5xl">{card.word}</span>
            {card.ipaUs || card.ipaUk ? (
              <span className="font-ipa text-lg text-stone-500">{card.ipaUs ?? card.ipaUk}</span>
            ) : null}
            {card.pos.length > 0 ? (
              <span className="flex flex-wrap justify-center gap-1">
                {card.pos.map((p) => (
                  <span key={p} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    {p}
                  </span>
                ))}
              </span>
            ) : null}
            <span className="mt-2 flex items-center gap-2 text-sm text-stone-500">
              {ttsSupported() ? (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Phát âm ${card.word}`}
                  onClick={(e) => { e.stopPropagation(); play(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); play(); } }}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border"
                >
                  <Volume2 size={18} aria-hidden />
                </span>
              ) : card.audioUrl ? (
                <audio controls src={card.audioUrl} className="max-w-[220px]" onClick={(e) => e.stopPropagation()} />
              ) : null}
              Bấm để lật · Space
            </span>
            {card.cefr ? (
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold text-stone-900", CEFR_COLOR[card.cefr] ?? "bg-stone-200")}>
                {card.cefr}
              </span>
            ) : null}
          </span>
          <span className="card-face card-back absolute inset-0 flex flex-col justify-center gap-2 overflow-auto rounded-3xl bg-stone-900 p-6 text-white shadow-card dark:bg-amber-200 dark:text-stone-900">
            <span className="text-2xl font-bold">{card.meaningVi.join("; ")}</span>
            {card.definitionEn ? <span className="text-sm opacity-80">{card.definitionEn}</span> : null}
            {card.examples.slice(0, 2).map((ex, i) => (
              <span key={i} className="text-sm">
                <span className="opacity-80">{highlightWord(ex.en, card.word)}</span>
                {ex.vi ? <span className="block opacity-70">{ex.vi}</span> : null}
              </span>
            ))}
            {card.synonyms.length > 0 ? <span className="text-xs opacity-70">≈ {card.synonyms.slice(0, 5).join(", ")}</span> : null}
            {card.note ? <span className="text-xs opacity-70">📝 {card.note}</span> : null}
            {card.mnemonic ? <span className="text-xs opacity-70">💡 {card.mnemonic}</span> : null}
          </span>
        </span>
      </button>
      <span className="sr-only" aria-live="polite">
        {autoplay ? "" : ""}
      </span>
    </div>
  );
}
