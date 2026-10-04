"use client";
/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect -- Study session is intentionally wall-clock driven (Date.now for SRS due/preview) and syncs queue/TTS with IndexedDB/audio on card change. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { EyeOff, MoonStar, Pencil, RotateCcw, Volume2 } from "lucide-react";
import { getDb } from "@/lib/db/client";
import { appendReviewLog, bumpDailyStat, loadSettings, saveSettings } from "@/lib/db/repositories";
import { gradeFsrs, previewDue } from "@/lib/srs/adapter";
import { buildQueue, type QueueItem } from "@/lib/srs/queue";
import { dayKey, dayStartMs } from "@/lib/clock/clock";
import { updateStreak } from "@/lib/gamification/streak";
import { speak, stopSpeak } from "@/lib/tts/speak";
import { Flashcard } from "@/components/study/Flashcard";
import { GradeButtons } from "@/components/study/GradeButtons";
import { CardForm, type CardFormValues } from "@/components/cards/CardForm";
import { cardSchema } from "@/lib/db/schemas";
import { useToasts } from "@/components/common/Toasts";
import type { Card, Cefr, Rating } from "@/types/entities";

type UndoEntry = { cardSnapshot: Card; logId: string; xpGained: number; wasNew: boolean; wasCorrect: boolean };

type Summary = {
  total: number;
  correct: number;
  newCount: number;
  ms: number;
  xp: number;
  wrong: Card[];
};

export function StudySession({ deckId, cram = false }: { deckId: string | null; cram?: boolean }) {
  const push = useToasts((s) => s.push);
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [deckName, setDeckName] = useState<string>("");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [history, setHistory] = useState<UndoEntry[]>([]);
  const [correct, setCorrect] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [wrongCards, setWrongCards] = useState<Card[]>([]);
  const [finished, setFinished] = useState(false);
  const [editing, setEditing] = useState(false);
  const [startMs] = useState(() => Date.now());
  const touchX = useRef<number | null>(null);

  const current = queue?.[idx]?.card ?? null;
  const nowMs = useMemo(() => Date.now(), [current]);

  const load = useCallback(async () => {
    const db = getDb();
    const settings = await loadSettings(db);
    const decks = await db.decks.toArray();
    if (deckId) {
      const d = decks.find((x) => x.id === deckId);
      setDeckName(d ? `${d.emoji} ${d.name}` : "");
    } else {
      setDeckName("Tất cả các bộ");
    }
    let cards: Card[];
    if (deckId) {
      cards = await db.cards.where("deckId").equals(deckId).toArray();
    } else {
      cards = await db.cards.toArray();
    }
    const q = buildQueue(cards, Date.now(), {
      newPerDay: settings.newPerDay,
      reviewPerDay: settings.reviewPerDay,
    });
    setQueue(q);
    setIdx(0);
    setFinished(q.length === 0);
  }, [deckId]);

  useEffect(() => {
    void load();
  }, [load]);

  // TTS tự phát khi hiện thẻ mới
  useEffect(() => {
    if (!current) return;
    setFlipped(false);
    void (async () => {
      try {
        const s = await loadSettings(getDb());
        if (s.ttsAutoplay) speak(current.word, { rate: s.ttsRate });
      } catch {
        // bỏ qua
      }
    })();
    return () => stopSpeak();
  }, [current]);

  const dueMap = useMemo(() => {
    if (!current) return null;
    try {
      // Đọc settings đồng bộ từ lần load gần nhất không có sẵn -> dùng mặc định 0.9/[1,10]/[10]
      return previewDue(current, Date.now(), {
        desiredRetention: 0.9,
        learningStepsMin: [1, 10],
        relearningStepsMin: [10],
      });
    } catch {
      return null;
    }
  }, [current]);

  async function grade(rating: Rating): Promise<void> {
    if (!queue || !current || flipped === false) return;
    const db = getDb();
    const settings = await loadSettings(db);
    const wasNew = current.state === 0;
    const prev = { ...current };
    const durationMs = 8000;
    if (cram) {
      const log = await appendReviewLog(db, {
        cardId: current.id,
        deckId: current.deckId,
        rating,
        state: current.state,
        mode: "flashcard",
        due: current.due,
        stability: current.stability,
        difficulty: current.difficulty,
        elapsedDays: current.elapsedDays,
        scheduledDays: current.scheduledDays,
        reviewedAt: Date.now(),
        durationMs,
      });
      setHistory((h) => [...h, { cardSnapshot: prev, logId: log.id, xpGained: 0, wasNew, wasCorrect: rating >= 2 }]);
      if (idx + 1 >= (queue?.length ?? 0)) setFinished(true);
      else setIdx((i) => i + 1);
      return;
    }
    const graded = gradeFsrs(current, rating, Date.now(), settings);
    const leech = graded.lapses >= settings.leechThreshold ? true : current.leech;
    const updated: Card = { ...current, ...graded, leech, updatedAt: Date.now() };
    const log = await appendReviewLog(db, {
      cardId: current.id,
      deckId: current.deckId,
      rating,
      state: current.state,
      mode: "flashcard",
      due: graded.due,
      stability: graded.stability,
      difficulty: graded.difficulty,
      elapsedDays: graded.elapsedDays,
      scheduledDays: graded.scheduledDays,
      reviewedAt: Date.now(),
      durationMs,
    });
    await db.cards.put(cardSchema.parse(updated));
    const isCorrect = rating >= 2;
    const gained = rating === 1 ? 0 : rating === 2 ? 5 : 10;
    await bumpDailyStat(db, Date.now(), settings.dayRolloverHour, {
      reviews: 1,
      newCards: wasNew ? 1 : 0,
      correct: isCorrect ? 1 : 0,
      timeMs: durationMs,
      xp: gained,
    });
    if (gained > 0) {
      const nextXp = settings.xp + gained;
      const { streak } = updateStreak(settings.streak, dayKey(Date.now(), settings.dayRolloverHour));
      await saveSettings(db, { xp: nextXp, level: Math.floor(nextXp / 200) + 1, streak });
    } else {
      const { streak } = updateStreak(settings.streak, dayKey(Date.now(), settings.dayRolloverHour));
      if (streak !== settings.streak) await saveSettings(db, { streak });
    }
    setHistory((h) => [...h, { cardSnapshot: prev, logId: log.id, xpGained: gained, wasNew, wasCorrect: isCorrect }]);
    setCorrect((c) => c + (isCorrect ? 1 : 0));
    setNewCount((c) => c + (wasNew ? 1 : 0));
    setXp((x) => x + gained);
    if (!isCorrect) {
      setWrongCards((w) => [...w, current]);
    }
    // Cập nhật queue snapshot: thay thẻ đã chấm, qua thẻ tiếp theo
    setQueue((q) => (q ?? []).map((it, i) => (i === idx ? { ...it, card: updated } : it)));
    if (idx + 1 >= (queue?.length ?? 0)) {
      setFinished(true);
      if (gained >= 0 && correct + (isCorrect ? 1 : 0) >= 5) {
        void import("canvas-confetti").then((m) => {
          try {
            m.default({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
          } catch {
            // bỏ qua
          }
        });
      }
    } else {
      setIdx((i) => i + 1);
    }
  }

  async function undo(): Promise<void> {
    const last = history[history.length - 1];
    if (!last) return;
    const db = getDb();
    await db.transaction("rw", [db.cards, db.reviewLogs, db.dailyStats, db.settings], async () => {
      await db.cards.put({ ...last.cardSnapshot, updatedAt: Date.now() });
      await db.reviewLogs.delete(last.logId);
    });
    setHistory((h) => h.slice(0, -1));
    setCorrect((c) => c - (last.wasCorrect ? 1 : 0));
    setNewCount((c) => c - (last.wasNew ? 1 : 0));
    setXp((x) => x - last.xpGained);
    setWrongCards((w) => w.filter((c) => c.id !== last.cardSnapshot.id));
    // Quay lại thẻ vừa undo
    setQueue((q) => {
      if (!q) return q;
      const at = q.findIndex((it) => it.card.id === last.cardSnapshot.id);
      if (at >= 0) {
        const nq = [...q];
        nq[at] = { ...nq[at]!, card: last.cardSnapshot };
        setIdx(at);
        return nq;
      }
      return q;
    });
    setFinished(false);
    push("Đã hoàn tác lần chấm vừa rồi.");
  }

  async function suspend(): Promise<void> {
    if (!current) return;
    const db = getDb();
    await db.cards.update(current.id, { suspended: true, updatedAt: Date.now() });
    push(`Đã tạm ẩn “${current.word}”.`, () => {
      void db.cards.update(current.id, { suspended: false, updatedAt: Date.now() });
    });
    next();
  }

  async function bury(): Promise<void> {
    if (!current) return;
    const db = getDb();
    const settings = await loadSettings(db);
    const until = dayStartMs(Date.now(), settings.dayRolloverHour) + 86400000;
    await db.cards.update(current.id, { buriedUntil: until, updatedAt: Date.now() });
    push(`Đã để “${current.word}” sang ngày mai.`);
    next();
  }

  function next(): void {
    if (!queue) return;
    if (idx + 1 >= queue.length) setFinished(true);
    else setIdx((i) => i + 1);
  }

  async function saveEdit(v: CardFormValues): Promise<void> {
    if (!current) return;
    const db = getDb();
    const merged = cardSchema.parse({
      ...current,
      word: v.word.trim(),
      meaningVi: v.meaningVi.split(";").map((s) => s.trim()).filter(Boolean),
      pos: v.pos.split(",").map((s) => s.trim()).filter(Boolean),
      ipaUs: v.ipa || undefined,
      ipaUk: v.ipa || undefined,
      definitionEn: v.definitionEn || undefined,
      examples: v.exampleEn ? [{ en: v.exampleEn, vi: v.exampleVi || undefined }] : current.examples,
      mnemonic: v.mnemonic || undefined,
      tags: v.tags.split(",").map((s) => s.trim()).filter(Boolean),
      cefr: (v.cefr || undefined) as Cefr | undefined,
      updatedAt: Date.now(),
    });
    await db.cards.put(merged);
    setQueue((q) => (q ?? []).map((it, i) => (i === idx ? { ...it, card: merged } : it)));
    setEditing(false);
    push("Đã lưu thẻ.");
  }

  // Phím tắt
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (editing || finished) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key >= "1" && e.key <= "4") {
        const r = Number(e.key) as Rating;
        if (flipped) void grade(r);
      } else if (e.key === "z" || e.key === "Z") {
        void undo();
      } else if (e.key === "s" || e.key === "S") {
        void suspend();
      } else if (e.key === "e" || e.key === "E") {
        setEditing(true);
      } else if (e.key === "r" || e.key === "R") {
        if (current) speak(current.word, { rate: 1 });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (queue === null) {
    return <div aria-busy="true" className="h-64 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />;
  }

  if (queue.length === 0) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="text-5xl" aria-hidden>🎉</p>
        <h1 className="mt-3 text-2xl font-extrabold">Hết thẻ hôm nay!</h1>
        <p className="mt-1 text-sm text-stone-500">Bạn đã ôn hết phần đến hạn{deckName ? ` của ${deckName}` : ""}. Thêm thẻ mới hoặc quay lại sau.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/decks" className="flex min-h-[44px] items-center rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white">Xem bộ thẻ</Link>
          <Link href="/dashboard" className="flex min-h-[44px] items-center rounded-2xl border px-5 text-sm font-bold">Tổng quan</Link>
        </div>
      </div>
    );
  }

  if (finished) {
    const total = history.length;
    const acc = total === 0 ? 0 : Math.round((correct / total) * 100);
    const summary: Summary = { total, correct, newCount, ms: Date.now() - startMs, xp, wrong: wrongCards };
    return (
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold">Tổng kết phiên 🎯</h1>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white p-4 text-center shadow-soft dark:bg-stone-900"><p className="text-2xl font-extrabold">{summary.total}</p><p className="text-xs">lượt ôn</p></div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-soft dark:bg-stone-900"><p className="text-2xl font-extrabold">{acc}%</p><p className="text-xs">đúng</p></div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-soft dark:bg-stone-900"><p className="text-2xl font-extrabold">+{summary.xp}</p><p className="text-xs">XP</p></div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-soft dark:bg-stone-900"><p className="text-2xl font-extrabold">{summary.newCount}</p><p className="text-xs">thẻ mới</p></div>
        </div>
        {summary.wrong.length > 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
            <h2 className="font-bold">Thẻ còn sai ({summary.wrong.length})</h2>
            <ul className="mt-2 text-sm">
              {summary.wrong.slice(0, 10).map((c) => (
                <li key={c.id}>• {c.word} — {c.meaningVi.join("; ")}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setQueue(summary.wrong.map((card) => ({ card, kind: "review" as const })));
                setIdx(0);
                setFinished(false);
                setHistory([]);
                setCorrect(0);
                setNewCount(0);
                setWrongCards([]);
              }}
              className="mt-3 flex min-h-[44px] items-center gap-2 rounded-2xl bg-stone-900 px-4 text-sm font-bold text-white dark:bg-white dark:text-stone-900"
            >
              <RotateCcw size={16} aria-hidden /> Ôn lại thẻ sai
            </button>
          </div>
        ) : null}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => void load().then(() => { setHistory([]); setCorrect(0); setNewCount(0); setXp(0); setWrongCards([]); })} className="flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border text-sm font-bold">Học tiếp</button>
          <Link href="/dashboard" className="flex min-h-[44px] flex-1 items-center justify-center rounded-2xl bg-orange-500 text-sm font-bold text-white">Xong</Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div
      className="mx-auto w-full max-w-xl"
      onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        if (touchX.current == null || !flipped) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        if (dx > 80) void grade(3);
        else if (dx < -80) void grade(1);
        touchX.current = null;
      }}
    >
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-bold">{deckName}</span>
        <span aria-live="polite">{idx + 1} / {queue.length}</span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" role="progressbar" aria-valuenow={idx + 1} aria-valuemin={0} aria-valuemax={queue.length} aria-label="Tiến độ">
        <div className="h-full bg-orange-500" style={{ width: `${((idx + 1) / queue.length) * 100}%` }} />
      </div>

      {editing ? (
        <div className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <h2 className="mb-2 font-bold">Sửa ngay trong lúc học</h2>
          <CardForm
            initial={{
              word: current.word,
              meaningVi: current.meaningVi.join("; "),
              pos: current.pos.join(", "),
              ipa: current.ipaUs ?? current.ipaUk ?? "",
              definitionEn: current.definitionEn ?? "",
              exampleEn: current.examples[0]?.en ?? "",
              exampleVi: current.examples[0]?.vi ?? "",
              mnemonic: current.mnemonic ?? "",
              tags: current.tags.join(", "),
              cefr: current.cefr ?? "",
            }}
            onSubmit={(v) => void saveEdit(v)}
            submitLabel="Lưu"
          />
          <button type="button" onClick={() => setEditing(false)} className="mt-2 text-sm underline">Đóng</button>
        </div>
      ) : (
        <Flashcard card={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} rate={1} />
      )}

      {!flipped ? (
        <button type="button" onClick={() => setFlipped(true)} className="mt-3 min-h-[52px] w-full rounded-2xl bg-stone-900 font-bold text-white dark:bg-white dark:text-stone-900">
          Lật thẻ (Space)
        </button>
      ) : (
        <div className="mt-3">
          <GradeButtons dueMap={dueMap} nowMs={nowMs} disabled={false} onGrade={(r) => void grade(r)} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button type="button" onClick={() => void undo()} disabled={history.length === 0} className="flex min-h-[40px] items-center gap-1 rounded-xl border px-3 font-bold disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Undo (Z)
        </button>
        <button type="button" onClick={() => void suspend()} className="flex min-h-[40px] items-center gap-1 rounded-xl border px-3 font-bold">
          <EyeOff size={14} aria-hidden /> Tạm ẩn (S)
        </button>
        <button type="button" onClick={() => void bury()} className="flex min-h-[40px] items-center gap-1 rounded-xl border px-3 font-bold">
          <MoonStar size={14} aria-hidden /> Để mai
        </button>
        <button type="button" onClick={() => setEditing(true)} className="flex min-h-[40px] items-center gap-1 rounded-xl border px-3 font-bold">
          <Pencil size={14} aria-hidden /> Sửa (E)
        </button>
        <button type="button" onClick={() => speak(current.word, { rate: 1 })} className="flex min-h-[40px] items-center gap-1 rounded-xl border px-3 font-bold">
          <Volume2 size={14} aria-hidden /> Đọc (R)
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-stone-500">Vuốt phải = Nhớ · Vuốt trái = Quên · Phím 1–4 để chấm</p>
    </div>
  );
}
