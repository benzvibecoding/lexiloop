"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Flame, Play, Snowflake, Trophy } from "lucide-react";
import { getDb } from "@/lib/db/client";
import { peekSettings } from "@/lib/db/repositories";
import { buildQueue } from "@/lib/srs/queue";
import { dayKey } from "@/lib/clock/clock";
import { BADGES, DAILY_QUESTS, evaluateBadges } from "@/lib/gamification/badges";
import { wordOfDay } from "@/lib/stats/compute";
import { speak } from "@/lib/tts/speak";
import { isSyncConfigured, syncAdapter } from "@/lib/sync/supabase";
import { useDbMounted, useInitSettings } from "@/stores/settings";
import { useGamePrefs } from "@/stores/game";

/** Nhắc học khi hôm nay chưa ôn + gợi đăng nhập giữ chuỗi (guest). */
function LoginHint({ studiedToday }: { studiedToday: boolean }) {
  const [userId, setUserId] = useState<string | null | undefined>(() => (isSyncConfigured() ? undefined : null));
  useEffect(() => {
    if (!isSyncConfigured()) return;
    void syncAdapter.getUserId().then(setUserId);
  }, []);
  if (userId === undefined) return null;
  return (
    <div className="mt-3 grid gap-2">
      {!studiedToday ? (
        <Link href="/review" className="flex min-h-[48px] items-center justify-center rounded-2xl bg-amber-300 px-4 text-sm font-bold text-stone-900">
          ⏰ Hôm nay chưa ôn thẻ nào — học ngay kẻo mất chuỗi!
        </Link>
      ) : null}
      {userId ? null : (
        <Link href={isSyncConfigured() ? "/settings" : "/leaderboard"} className="flex min-h-[48px] items-center justify-center rounded-2xl border px-4 text-sm font-bold">
          🔒 Dùng ngay không cần tài khoản, nhưng đăng nhập mới giữ được chuỗi khi đổi máy →
        </Link>
      )}
    </div>
  );
}

function Ring({ value, max }: { value: number; max: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, max === 0 ? 0 : value / max);
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`Tiến độ ${value} trên ${max}`}>
      <circle cx="44" cy="44" r={r} fill="none" strokeWidth="10" className="stroke-stone-200 dark:stroke-stone-800" />
      <circle
        cx="44" cy="44" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        className="stroke-orange-500" transform="rotate(-90 44 44)"
      />
      <text x="44" y="48" textAnchor="middle" fontWeight="800" fontSize="16" className="fill-stone-900 dark:fill-white">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

export default function DashboardPage() {
  const mounted = useDbMounted();
  useInitSettings();
  const gameOn = useGamePrefs((s) => s.enabled);
  const markSeen = useGamePrefs((s) => s.markSeen);

  const data = useLiveQuery(async () => {
    if (!mounted) return null;
    const db = getDb();
    const settings = await peekSettings(db);
    const [decks, cards, logs, stats] = await Promise.all([
      db.decks.toArray(),
      db.cards.toArray(),
      db.reviewLogs.orderBy("reviewedAt").reverse().limit(500).toArray(),
      db.dailyStats.toArray(),
    ]);
    const aliveDecks = decks.filter((d) => d.deletedAt == null && !d.archived);
    const aliveCards = cards.filter((c) => c.deletedAt == null);
    const now = Date.now();
    const queue = buildQueue(aliveCards, now, { newPerDay: settings.newPerDay, reviewPerDay: settings.reviewPerDay });
    const dueCount = queue.length;
    const newCount = queue.filter((q) => q.kind === "new").length;
    const today = dayKey(now, settings.dayRolloverHour);
    const todayStat = stats.find((s) => s.date === today);
    const goal = settings.dailyGoalReviews;
    const lastLog = logs[0];
    const lastDeck = aliveDecks.find((d) => d.id === lastLog?.deckId) ?? null;
    const wod = wordOfDay(aliveCards, today);
    const mature = aliveCards.filter((c) => c.state === 2 && c.scheduledDays >= 21).length;
    const badgeIds = evaluateBadges({ settings, stats, logs, totalReviews: todayStat ? stats.reduce((a, s) => a + s.reviews, 0) : stats.reduce((a, s) => a + s.reviews, 0), totalCards: aliveCards.length, matureCards: mature });
    return { settings, aliveDecks, aliveCards, dueCount, newCount, todayStat, goal, lastDeck, wod, today, badgeIds, stats, logs };
  }, [mounted]);

  if (!mounted || !data) {
    return <div aria-busy="true" className="grid gap-3 md:grid-cols-3"><div className="h-28 animate-pulse rounded-3xl bg-stone-200" /><div className="h-28 animate-pulse rounded-3xl bg-stone-200" /><div className="h-28 animate-pulse rounded-3xl bg-stone-200" /></div>;
  }

  const earned = BADGES.filter((b) => data.badgeIds.includes(b.id));
  const freshBadges = earned.filter((b) => !useGamePrefs.getState().seenBadges.includes(b.id));
  if (freshBadges.length > 0) markSeen(freshBadges.map((b) => b.id));

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Hôm nay bạn học gì? 🔥{data.settings.streak.current}</h1>
      <LoginHint studiedToday={(data.todayStat?.reviews ?? 0) > 0} />
      {!data.settings.onboardingDone ? (
        <Link href="/onboarding" className="mt-3 flex min-h-[52px] items-center justify-center rounded-2xl bg-amber-300 px-4 font-bold text-stone-900">
          👋 Mới dùng? Hoàn tất onboarding 1 phút để được gợi ý deck →
        </Link>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900">
          <Ring value={data.todayStat?.reviews ?? 0} max={data.goal} />
          <div>
            <p className="font-extrabold">{data.dueCount} thẻ đến hạn · {data.newCount} mới</p>
            <p className="text-sm text-stone-500">Hôm nay đã ôn {data.todayStat?.reviews ?? 0}/{data.goal} · streak {data.settings.streak.current} ngày (tốt nhất {data.settings.streak.best}) {data.settings.streak.freezes > 0 ? `· 🧊${data.settings.streak.freezes}` : ""}</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900">
          <p className="flex items-center gap-1 font-bold"><Flame size={16} aria-hidden /> Tiếp tục</p>
          {data.lastDeck ? (
            <Link href={`/study?deck=${data.lastDeck.id}`} className="mt-2 flex min-h-[48px] items-center justify-center rounded-2xl bg-stone-900 font-bold text-white dark:bg-white dark:text-stone-900">
              <Play size={16} aria-hidden /> {data.lastDeck.emoji} {data.lastDeck.name}
            </Link>
          ) : (
            <Link href="/decks" className="mt-2 block text-sm underline">Tạo bộ thẻ đầu tiên →</Link>
          )}
          <Link href="/study" className="mt-2 flex min-h-[52px] items-center justify-center rounded-2xl bg-orange-500 font-bold text-white">Bắt đầu ôn tập →</Link>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900">
          <p className="font-bold">Từ của ngày</p>
          {data.wod ? (
            <div>
              <p className="mt-1 text-2xl font-extrabold">{data.wod.word}</p>
              <p className="text-sm text-stone-500">{data.wod.meaningVi.join("; ")}</p>
              <button type="button" onClick={() => speak(data.wod!.word, { rate: 0.9 })} className="mt-2 min-h-[40px] rounded-xl border px-3 text-xs font-bold">🔊 Nghe</button>
            </div>
          ) : (
            <p className="mt-1 text-sm text-stone-500">Chưa có thẻ nào — thêm thẻ để mỗi ngày gặp 1 từ mới.</p>
          )}
        </div>
      </div>

      {gameOn ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900">
            <p className="flex items-center gap-1 font-bold"><Trophy size={16} aria-hidden /> Huy hiệu ({earned.length}/{BADGES.length}) · Level {data.settings.level} · {data.settings.xp} XP</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {BADGES.map((b) => {
                const got = data.badgeIds.includes(b.id);
                return (
                  <span key={b.id} title={`${b.name}: ${b.desc}`} aria-label={`${b.name}${got ? " (đạt)" : ""}`} className={`rounded-full px-2 py-1 text-lg ${got ? "bg-amber-100" : "bg-stone-100 opacity-40 grayscale dark:bg-stone-800"}`}>
                    {b.icon}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900">
            <p className="font-bold">Nhiệm vụ hôm nay</p>
            <ul className="mt-2 space-y-2">
              {DAILY_QUESTS.map((q) => {
                const p = q.progress({ settings: data.settings, stats: data.stats, logs: data.logs, totalReviews: 0, totalCards: 0, matureCards: 0 }, data.today);
                return (
                  <li key={q.id}>
                    <div className="flex justify-between text-sm"><span>{q.name}</span><span>{p}/{q.target}</span></div>
                    <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(p / q.target) * 100}%` }} /></div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 flex items-center gap-1 text-xs text-stone-500"><Snowflake size={12} aria-hidden /> Streak freeze: {data.settings.streak.freezes} — nghỉ 1 ngày vẫn giữ streak.</p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-stone-500">Gamification đang tắt (bật lại trong Cài đặt).</p>
      )}
    </div>
  );
}
