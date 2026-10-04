import type { Card, DailyStat, ReviewLog } from "@/types/entities";
import { addDaysKey, dayKey } from "@/lib/clock/clock";

/** True retention: tỉ lệ Hard/Good/Easy trên log ở trạng thái Review (state=2 lúc chấm). */
export function trueRetention(logs: ReviewLog[]): number | null {
  const rev = logs.filter((l) => l.state === 2);
  if (rev.length === 0) return null;
  const ok = rev.filter((l) => l.rating >= 2).length;
  return ok / rev.length;
}

export type StateDist = { fresh: number; learning: number; young: number; mature: number };

/** Phân bố: mới (state 0) / đang học (1,3) / young (review, scheduled<21) / mature (≥21). */
export function stateDistribution(cards: Card[]): StateDist {
  const alive = cards.filter((c) => c.deletedAt == null);
  return {
    fresh: alive.filter((c) => c.state === 0).length,
    learning: alive.filter((c) => c.state === 1 || c.state === 3).length,
    young: alive.filter((c) => c.state === 2 && c.scheduledDays < 21).length,
    mature: alive.filter((c) => c.state === 2 && c.scheduledDays >= 21).length,
  };
}

/** Dự báo số thẻ đến hạn 30 ngày tới (due <= mỗi ngày). */
export function forecastDue(cards: Card[], nowMs: number, days = 30): Array<{ date: string; count: number }> {
  const alive = cards.filter((c) => c.deletedAt == null && !c.suspended);
  const out: Array<{ date: string; count: number }> = [];
  const today = dayKey(nowMs, 4);
  for (let i = 0; i < days; i++) {
    const key = addDaysKey(today, i);
    const endOfDay = new Date(nowMs);
    endOfDay.setDate(endOfDay.getDate() + i);
    endOfDay.setHours(23, 59, 59, 999);
    const count = alive.filter((c) => c.due <= endOfDay.getTime()).length;
    out.push({ date: key.slice(5), count });
  }
  return out;
}

export function heatmapYear(stats: DailyStat[], nowMs: number, days = 364): Array<{ date: string; count: number }> {
  const map = new Map(stats.map((s) => [s.date, s.reviews]));
  const today = dayKey(nowMs, 4);
  const out: Array<{ date: string; count: number }> = [];
  for (let i = days; i >= 0; i--) {
    const key = addDaysKey(today, -i);
    out.push({ date: key, count: map.get(key) ?? 0 });
  }
  return out;
}

export function vocabGrowth(cards: Card[], days = 90, nowMs = Date.now()): Array<{ date: string; total: number }> {
  const created = cards
    .filter((c) => c.deletedAt == null)
    .map((c) => c.createdAt)
    .sort((a, b) => a - b);
  const today = dayKey(nowMs, 4);
  const out: Array<{ date: string; total: number }> = [];
  for (let i = days; i >= 0; i--) {
    const key = addDaysKey(today, -i);
    const end = new Date(nowMs);
    end.setDate(end.getDate() - i);
    end.setHours(23, 59, 59, 999);
    out.push({ date: key.slice(5), total: created.filter((t) => t <= end.getTime()).length });
  }
  return out;
}

/** Từ của ngày: chọn deterministic theo ngày từ danh sách thẻ. */
export function wordOfDay<T>(items: T[], dateKey: string): T | null {
  if (items.length === 0) return null;
  let h = 0;
  for (const ch of dateKey) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return items[h % items.length] ?? null;
}
