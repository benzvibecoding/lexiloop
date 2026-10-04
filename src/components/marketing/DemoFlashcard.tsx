"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { useT } from "@/stores/prefs";
import { cn } from "@/lib/utils";

export function DemoFlashcard() {
  const [flipped, setFlipped] = useState(false);
  const t = useT();
  return (
    <div className="w-full max-w-sm">
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-pressed={flipped}
        aria-label={t("demo_front_hint")}
        className={cn("card-3d w-full text-left", flipped && "flipped")}
      >
        <span className="card-3d-inner relative block h-64 w-full">
          <span className="card-face absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white p-6 shadow-card dark:bg-stone-900">
            <span className="text-4xl font-extrabold tracking-tight">{t("demo_word")}</span>
            <span className="font-ipa text-lg text-stone-500">{t("demo_ipa")} ʃ ʒ θ ð ŋ ə ɪ ʊ</span>
            <span className="mt-2 flex items-center gap-2 text-sm text-stone-500">
              <Volume2 size={16} aria-hidden /> {t("demo_front_hint")}
            </span>
            <span className="mt-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-stone-900">
              B1
            </span>
          </span>
          <span className="card-face card-back absolute inset-0 flex flex-col justify-center gap-2 rounded-3xl bg-stone-900 p-6 text-white shadow-card dark:bg-amber-300 dark:text-stone-900">
            <span className="text-xl font-bold">{t("demo_meaning")}</span>
            <span className="text-sm opacity-80">She showed resilient spirit after failing the exam.</span>
            <span className="text-sm opacity-70">Cô ấy vẫn kiên cường sau khi trượt kỳ thi.</span>
          </span>
        </span>
      </button>
    </div>
  );
}
