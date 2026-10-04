import { addDaysKey, dayKey, diffDaysKey } from "@/lib/clock/clock";
import type { StreakState } from "@/types/entities";

export type StreakOutcome = {
  streak: StreakState;
  usedFreeze: boolean;
};

/** Cập nhật streak khi học vào ngày studyKey (YYYY-MM-DD theo rollover). */
export function updateStreak(prev: StreakState, studyKey: string): StreakOutcome {
  const last = prev.lastStudyDate;
  if (last === studyKey) return { streak: prev, usedFreeze: false };
  if (last == null) {
    const s: StreakState = { current: 1, best: Math.max(1, prev.best), freezes: prev.freezes, lastStudyDate: studyKey };
    return { streak: s, usedFreeze: false };
  }
  const gap = diffDaysKey(studyKey, last);
  if (gap <= 0) return { streak: prev, usedFreeze: false };
  if (gap === 1) {
    const current = prev.current + 1;
    // Thưởng 1 freeze mỗi mốc 7 ngày
    const freezes = current % 7 === 0 ? prev.freezes + 1 : prev.freezes;
    return {
      streak: { current, best: Math.max(prev.best, current), freezes, lastStudyDate: studyKey },
      usedFreeze: false,
    };
  }
  if (gap === 2 && prev.freezes > 0) {
    // Dùng freeze giữ streak (bỏ qua 1 ngày)
    const current = prev.current + 1;
    return {
      streak: { current, best: Math.max(prev.best, current), freezes: prev.freezes - 1, lastStudyDate: studyKey },
      usedFreeze: true,
    };
  }
  return {
    streak: { current: 1, best: prev.best, freezes: prev.freezes, lastStudyDate: studyKey },
    usedFreeze: false,
  };
}

/** Mục tiêu ngày: số lượt ôn = thẻ mới/ngày + 10. */
export function dailyGoalReviews(newPerDay: number): number {
  return Math.max(5, newPerDay + 10);
}

export function nextFreezeDates(lastStudyDate: string | null): string[] {
  if (!lastStudyDate) return [];
  return [addDaysKey(lastStudyDate, 1), addDaysKey(lastStudyDate, 2)];
}

export function todayKey(nowMs: number, rolloverHour: number): string {
  return dayKey(nowMs, rolloverHour);
}
