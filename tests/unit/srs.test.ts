import { describe, expect, it } from "vitest";
import { gradeFsrs, previewDue } from "@/lib/srs/adapter";
import { buildQueue, countDue } from "@/lib/srs/queue";
import { formatInterval } from "@/lib/srs/format";
import type { Card } from "@/types/entities";

const baseSettings = { desiredRetention: 0.9, learningStepsMin: [1, 10], relearningStepsMin: [10] };

function mkCard(partial: Partial<Card> = {}): Card {
  const now = Date.now();
  return {
    id: "c1",
    deckId: "d1",
    word: "resilient",
    pos: [],
    meaningVi: ["kiên cường"],
    examples: [],
    synonyms: [],
    antonyms: [],
    collocations: [],
    wordFamily: [],
    tags: [],
    due: now,
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    learningSteps: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    suspended: false,
    leech: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

describe("fsrs adapter", () => {
  it("Again < Hard < Good < Easy due order", () => {
    const c = mkCard();
    const now = Date.now();
    const p = previewDue(c, now, baseSettings);
    expect(p[1]).toBeLessThanOrEqual(p[2]);
    expect(p[2]).toBeLessThanOrEqual(p[3]);
    expect(p[3]).toBeLessThanOrEqual(p[4]);
  });

  it("Again increases lapses on a review card", () => {
    const c = mkCard({ state: 2, stability: 5, difficulty: 5, reps: 5, scheduledDays: 10, elapsedDays: 10 });
    const out = gradeFsrs(c, 1, Date.now(), baseSettings);
    expect(out.lapses).toBe(1);
    expect(out.state === 1 || out.state === 3).toBe(true);
  });

  it("Good advances a new card", () => {
    const c = mkCard();
    const out = gradeFsrs(c, 3, Date.now(), baseSettings);
    expect(out.reps).toBe(1);
    expect(out.due).toBeGreaterThan(Date.now() - 1000);
  });
});

describe("queue", () => {
  it("orders learning -> review -> new and caps limits", () => {
    const now = Date.now();
    const cards = [
      mkCard({ id: "new1", state: 0, createdAt: now - 3 }),
      mkCard({ id: "new2", state: 0, createdAt: now - 2 }),
      mkCard({ id: "rev1", state: 2, due: now - 1000 }),
      mkCard({ id: "learn1", state: 1, due: now - 2000 }),
      mkCard({ id: "susp", state: 2, due: now - 1000, suspended: true }),
      mkCard({ id: "buried", state: 2, due: now - 1000, buriedUntil: now + 99999 }),
      mkCard({ id: "future", state: 2, due: now + 99999 }),
    ];
    const q = buildQueue(cards, now, { newPerDay: 1, reviewPerDay: 10 });
    expect(q.map((x) => x.card.id)).toEqual(["learn1", "rev1", "new1"]);
    const counts = countDue(cards, now);
    expect(counts.learning).toBe(1);
  });
});

describe("formatInterval", () => {
  it("formats vi short units", () => {
    const now = 0;
    expect(formatInterval(now, now + 60_000)).toBe("1p");
    expect(formatInterval(now, now + 86400_000)).toBe("1n");
  });
});
