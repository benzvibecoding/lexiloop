"use client";

import { useState } from "react";
import Link from "next/link";
import raw from "@/data/placement.json";
import { estimateCefr, placementSchema, type PlacementItem } from "@/lib/placement";
import { suggestDecks } from "@/lib/library/starter";

const ITEMS: PlacementItem[] = placementSchema.parse(raw);

export default function PlacementPage() {
  const [answers, setAnswers] = useState<Array<number | null>>(Array(ITEMS.length).fill(null));
  const [done, setDone] = useState(false);
  const level = estimateCefr(ITEMS, answers);
  const correct = ITEMS.filter((q, i) => answers[i] === q.answer).length;

  if (done) {
    const sug = suggestDecks("communication", level);
    return (
      <main className="mx-auto max-w-xl p-6 text-center">
        <p className="text-5xl" aria-hidden>🎯</p>
        <h1 className="mt-2 text-2xl font-extrabold">Trình độ ước lượng: {level}</h1>
        <p className="text-sm text-stone-500">Đúng {correct}/20 câu. Đây chỉ là ước lượng nhanh, không thay thế thi thật.</p>
        <div className="mt-4 text-left">
          <p className="font-bold">Deck gợi ý:</p>
          <ul className="mt-1 space-y-1">
            {sug.slice(0, 3).map((d) => (
              <li key={d.id}>{d.emoji} {d.name} ({d.cards.length} thẻ)</li>
            ))}
          </ul>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/library" className="flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-orange-500 font-bold text-white">Xem thư viện →</Link>
          <Link href="/onboarding" className="flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border font-bold">Onboarding →</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-extrabold">Test trình độ (20 câu)</h1>
      <p className="text-sm text-stone-500">Chọn nghĩa đúng. Càng về sau càng khó.</p>
      <ol className="mt-4 space-y-4">
        {ITEMS.map((q, i) => (
          <li key={q.id} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
            <p className="font-bold">{i + 1}. {q.prompt} <span className="text-xs text-stone-400">{q.band}</span></p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {q.options.map((op, oi) => (
                <button
                  key={oi}
                  type="button"
                  onClick={() => setAnswers((a) => a.map((v, vi) => (vi === i ? oi : v)))}
                  aria-pressed={answers[i] === oi}
                  className={`min-h-[44px] rounded-xl border px-3 text-sm ${answers[i] === oi ? "border-orange-500 bg-orange-50 dark:bg-orange-950" : ""}`}
                >
                  {op}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={answers.some((a) => a == null)}
        onClick={() => setDone(true)}
        className="mt-4 min-h-[52px] w-full rounded-2xl bg-orange-500 font-bold text-white disabled:opacity-40"
      >
        Xem kết quả
      </button>
    </main>
  );
}
