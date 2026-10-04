import { describe, expect, it } from "vitest";
import { updateStreak, dailyGoalReviews } from "@/lib/gamification/streak";
import { BADGES, DAILY_QUESTS, evaluateBadges, levelForXp } from "@/lib/gamification/badges";
import { forecastDue, heatmapYear, stateDistribution, trueRetention, wordOfDay } from "@/lib/stats/compute";
import type { Card } from "@/types/entities";

function mkCard(id: string, state: Card["state"], due: number, scheduled = 0): Card {
  const now = Date.now();
  return {
    id, deckId: "d", word: id, pos: [], meaningVi: ["m"], examples: [], synonyms: [],
    antonyms: [], collocations: [], wordFamily: [], tags: [], due, stability: 0, difficulty: 0,
    elapsedDays: 0, scheduledDays: scheduled, learningSteps: 0, reps: 0, lapses: 0,
    state, suspended: false, leech: false, createdAt: now, updatedAt: now,
  };
}

describe("streak", () => {
  it("starts and continues", () => {
    const s0 = { current: 0, best: 0, freezes: 0, lastStudyDate: null };
    const r1 = updateStreak(s0, "2026-10-04");
    expect(r1.streak.current).toBe(1);
    const r2 = updateStreak(r1.streak, "2026-10-05");
    expect(r2.streak.current).toBe(2);
  });

  it("uses freeze on 1-day gap", () => {
    const s = { current: 5, best: 5, freezes: 1, lastStudyDate: "2026-10-04" };
    const r = updateStreak(s, "2026-10-06");
    expect(r.usedFreeze).toBe(true);
    expect(r.streak.freezes).toBe(0);
    expect(r.streak.current).toBe(6);
  });

  it("resets on long gap without freeze", () => {
    const s = { current: 5, best: 5, freezes: 0, lastStudyDate: "2026-10-01" };
    const r = updateStreak(s, "2026-10-06");
    expect(r.streak.current).toBe(1);
  });

  it("daily goal sane", () => {
    expect(dailyGoalReviews(10)).toBe(20);
  });
});

describe("badges", () => {
  it("has ~20 badges and evaluates", () => {
    expect(BADGES.length).toBeGreaterThanOrEqual(18);
    const ids = evaluateBadges({
      settings: { id: "main", onboardingDone: true, newPerDay: 10, reviewPerDay: 200, dailyGoalReviews: 20, desiredRetention: 0.9, learningStepsMin: [1, 10], relearningStepsMin: [10], dayRolloverHour: 4, leechThreshold: 8, ttsRate: 1, ttsAutoplay: true, defaultMode: "flashcard", frontSide: "word", boardOptIn: false, xp: 150, level: 1, streak: { current: 7, best: 7, freezes: 0, lastStudyDate: null }, updatedAt: 0 },
      stats: [{ date: "2026-10-04", reviews: 60, newCards: 5, correct: 60, timeMs: 1, xp: 60 }],
      logs: [],
      totalReviews: 120,
      totalCards: 60,
      matureCards: 0,
    });
    expect(ids).toContain("first-step");
    expect(ids).toContain("streak-7");
    expect(levelForXp(0)).toBe(1);
    expect(DAILY_QUESTS).toHaveLength(3);
  });
});

describe("stats compute", () => {
  it("true retention only counts Review state", () => {
    const logs = [
      { id: "1", cardId: "a", deckId: "d", rating: 3, state: 2, mode: "flashcard", due: 0, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reviewedAt: 0, durationMs: 0 },
      { id: "2", cardId: "b", deckId: "d", rating: 1, state: 2, mode: "flashcard", due: 0, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reviewedAt: 0, durationMs: 0 },
      { id: "3", cardId: "c", deckId: "d", rating: 1, state: 1, mode: "flashcard", due: 0, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reviewedAt: 0, durationMs: 0 },
    ] as never;
    expect(trueRetention(logs as never)).toBe(0.5);
    expect(trueRetention([])).toBeNull();
  });

  it("distributes states", () => {
    const now = Date.now();
    const cards = [
      mkCard("a", 0, now), mkCard("b", 1, now),
      mkCard("c", 2, now, 5), mkCard("d", 2, now, 30),
    ];
    expect(stateDistribution(cards)).toEqual({ fresh: 1, learning: 1, young: 1, mature: 1 });
  });

  it("forecast grows monotonically", () => {
    const now = Date.now();
    const f = forecastDue([mkCard("a", 2, now)], now, 5);
    expect(f).toHaveLength(5);
    expect(f[4]!.count).toBeGreaterThanOrEqual(f[0]!.count);
  });

  it("heatmap covers 365 and wordOfDay deterministic", () => {
    const h = heatmapYear([], Date.now(), 364);
    expect(h).toHaveLength(365);
    const items = ["a", "b", "c"];
    expect(wordOfDay(items, "2026-10-04")).toBe(wordOfDay(items, "2026-10-04"));
  });
});
