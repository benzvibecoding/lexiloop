import type { AppSettings, DailyStat, ReviewLog } from "@/types/entities";

export type BadgeContext = {
  settings: AppSettings;
  stats: DailyStat[];
  logs: ReviewLog[];
  totalReviews: number;
  totalCards: number;
  matureCards: number;
};

export type Badge = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (ctx: BadgeContext) => boolean;
};

function reviewsOn(date: string, stats: DailyStat[]): number {
  return stats.find((s) => s.date === date)?.reviews ?? 0;
}

export const BADGES: Badge[] = [
  { id: "first-step", name: "Bước đầu tiên", desc: "Ôn 1 thẻ", icon: "👣", check: (c) => c.totalReviews >= 1 },
  { id: "warm-up", name: "Khởi động", desc: "Ôn 20 thẻ", icon: "🔥", check: (c) => c.totalReviews >= 20 },
  { id: "century", name: "Trăm trận", desc: "Ôn 100 thẻ", icon: "💯", check: (c) => c.totalReviews >= 100 },
  { id: "scholar", name: "Học giả", desc: "Ôn 500 thẻ", icon: "🎓", check: (c) => c.totalReviews >= 500 },
  { id: "marathon", name: "Marathon", desc: "Ôn 2000 thẻ", icon: "🏃", check: (c) => c.totalReviews >= 2000 },
  { id: "streak-3", name: "Giữ lửa 3", desc: "Streak 3 ngày", icon: "🔥", check: (c) => c.settings.streak.current >= 3 },
  { id: "streak-7", name: "Tuần vàng", desc: "Streak 7 ngày", icon: "🌟", check: (c) => c.settings.streak.current >= 7 || c.settings.streak.best >= 7 },
  { id: "streak-30", name: "Tháng bền bỉ", desc: "Streak 30 ngày", icon: "🏆", check: (c) => c.settings.streak.best >= 30 },
  { id: "xp-100", name: "Tích lũy", desc: "Đạt 100 XP", icon: "✨", check: (c) => c.settings.xp >= 100 },
  { id: "xp-1000", name: "Ngàn sao", desc: "Đạt 1000 XP", icon: "💫", check: (c) => c.settings.xp >= 1000 },
  { id: "level-5", name: "Level 5", desc: "Lên cấp 5", icon: "🚀", check: (c) => c.settings.level >= 5 },
  { id: "vocab-50", name: "Vốn từ 50", desc: "50 thẻ", icon: "📚", check: (c) => c.totalCards >= 50 },
  { id: "vocab-200", name: "Vốn từ 200", desc: "200 thẻ", icon: "📖", check: (c) => c.totalCards >= 200 },
  { id: "mature-50", name: "Trí nhớ dài hạn", desc: "50 thẻ mature", icon: "🧠", check: (c) => c.matureCards >= 50 },
  { id: "perfect-day", name: "Ngày hoàn hảo", desc: "1 ngày đúng 100% (≥10 lượt)", icon: "🎯", check: (c) => c.stats.some((s) => s.reviews >= 10 && s.correct === s.reviews) },
  { id: "busy-day", name: "Ngày bận rộn", desc: "1 ngày ôn 50+ lượt", icon: "⚡", check: (c) => c.stats.some((s) => s.reviews >= 50) },
  { id: "early-bird", name: "Chim sớm", desc: "Ôn trước 7h sáng", icon: "🌅", check: (c) => c.logs.some((l) => new Date(l.reviewedAt).getHours() < 7) },
  { id: "night-owl", name: "Cú đêm", desc: "Ôn sau 22h", icon: "🦉", check: (c) => c.logs.some((l) => new Date(l.reviewedAt).getHours() >= 22) },
  { id: "persistent", name: "Kiên trì", desc: "Học 7 ngày khác nhau", icon: "📅", check: (c) => c.stats.filter((s) => s.reviews > 0).length >= 7 },
  { id: "freeze-saver", name: "Phao cứu sinh", desc: "Có 2 freeze", icon: "🧊", check: (c) => c.settings.streak.freezes >= 2 },
];

export function evaluateBadges(ctx: BadgeContext): string[] {
  return BADGES.filter((b) => {
    try {
      return b.check(ctx);
    } catch {
      return false;
    }
  }).map((b) => b.id);
}

export type Quest = {
  id: string;
  name: string;
  target: number;
  progress: (ctx: BadgeContext, today: string) => number;
};

export const DAILY_QUESTS: Quest[] = [
  { id: "q-review-10", name: "Ôn 10 lượt", target: 10, progress: (c, t) => Math.min(reviewsOn(t, c.stats), 10) },
  { id: "q-new-5", name: "Học 5 thẻ mới", target: 5, progress: (c, t) => Math.min(c.stats.find((s) => s.date === t)?.newCards ?? 0, 5) },
  { id: "q-xp-50", name: "Kiếm 50 XP", target: 50, progress: (c, t) => Math.min(c.stats.find((s) => s.date === t)?.xp ?? 0, 50) },
];

export function levelForXp(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

export function xpForRating(rating: number): number {
  if (rating <= 1) return 0;
  if (rating === 2) return 5;
  return 10;
}

export function nextLevelXp(level: number): number {
  return level * 200;
}
