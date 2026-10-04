"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { loadSettings, saveSettings } from "@/lib/db/repositories";
import { suggestDecks, cloneStarterDeck, type Goal } from "@/lib/library/starter";
import { useToasts } from "@/components/common/Toasts";

const GOALS: Array<{ id: Goal; label: string }> = [
  { id: "ielts", label: "IELTS" },
  { id: "toeic", label: "TOEIC" },
  { id: "communication", label: "Giao tiếp" },
  { id: "work", label: "Công việc" },
  { id: "study-abroad", label: "Du học" },
];

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const DAILY = [5, 10, 20, 30];

export default function OnboardingPage() {
  const router = useRouter();
  const push = useToasts((s) => s.push);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>("communication");
  const [level, setLevel] = useState("A1");
  const [perDay, setPerDay] = useState(10);
  const [adding, setAdding] = useState(false);

  const suggested = suggestDecks(goal, level);

  async function finish(): Promise<void> {
    const db = getDb();
    const s = await loadSettings(db);
    await saveSettings(db, { ...s, newPerDay: perDay, onboardingDone: true, updatedAt: Date.now() });
    push("Xong! Gợi ý deck phù hợp ở dưới — bấm để thêm.");
  }

  async function addAll(): Promise<void> {
    setAdding(true);
    try {
      let n = 0;
      for (const d of suggested.slice(0, 3)) {
        const r = await cloneStarterDeck(db0(), d.id);
        n += r.cards;
      }
      push(`Đã thêm ${n} thẻ gợi ý. Bắt đầu học thôi!`);
      router.push("/review");
    } finally {
      setAdding(false);
    }
  }

  function db0() {
    return getDb();
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <p className="text-sm text-stone-500">LexiLoop · Bắt đầu 1 phút {step < 3 ? `(${step + 1}/3)` : ""} · <Link href="/dashboard" className="underline">Bỏ qua</Link></p>
      {step === 0 ? (
        <section>
          <h1 className="mt-2 text-2xl font-extrabold">Bạn học để làm gì?</h1>
          <div className="mt-3 grid gap-2">
            {GOALS.map((g) => (
              <button key={g.id} type="button" onClick={() => { setGoal(g.id); setStep(1); }} aria-pressed={goal === g.id} className={`min-h-[52px] rounded-2xl border px-4 text-left font-bold ${goal === g.id ? "border-orange-500 bg-orange-50 dark:bg-orange-950" : ""}`}>
                {g.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {step === 1 ? (
        <section>
          <h1 className="mt-2 text-2xl font-extrabold">Trình độ hiện tại?</h1>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {LEVELS.map((l) => (
              <button key={l} type="button" onClick={() => { setLevel(l); setStep(2); }} className={`min-h-[52px] rounded-2xl border font-extrabold ${level === l ? "border-orange-500 bg-orange-50 dark:bg-orange-950" : ""}`}>
                {l}
              </button>
            ))}
          </div>
          <Link href="/placement" className="mt-3 block text-center text-sm underline">Không chắc? Làm test 20 câu (1 phút) →</Link>
          <button type="button" onClick={() => setStep(0)} className="mt-2 text-sm underline">← Quay lại</button>
        </section>
      ) : null}
      {step === 2 ? (
        <section>
          <h1 className="mt-2 text-2xl font-extrabold">Mỗi ngày học bao nhiêu từ mới?</h1>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {DAILY.map((n) => (
              <button key={n} type="button" onClick={() => { setPerDay(n); setStep(3); void finish(); }} className={`min-h-[52px] rounded-2xl border font-extrabold ${perDay === n ? "border-orange-500 bg-orange-50 dark:bg-orange-950" : ""}`}>
                {n}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep(1)} className="mt-2 text-sm underline">← Quay lại</button>
        </section>
      ) : null}
      {step === 3 ? (
        <section>
          <h1 className="mt-2 text-2xl font-extrabold">Gợi ý cho bạn 🎯</h1>
          <p className="text-sm text-stone-500">Mục tiêu {goal} · trình độ {level} · {perDay} từ/ngày</p>
          <ul className="mt-3 space-y-2">
            {suggested.slice(0, 3).map((d) => (
              <li key={d.id} className="rounded-2xl bg-white p-3 shadow-sm dark:bg-stone-900">
                {d.emoji} <b>{d.name}</b> · {d.cards.length} thẻ
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => void addAll()} disabled={adding} className="mt-3 min-h-[52px] w-full rounded-2xl bg-orange-500 font-bold text-white disabled:opacity-50">
            {adding ? "Đang thêm…" : "Thêm 3 deck gợi ý & bắt đầu học"}
          </button>
          <Link href="/dashboard" className="mt-2 block text-center text-sm underline">Để sau, vào app →</Link>
        </section>
      ) : null}
    </main>
  );
}
