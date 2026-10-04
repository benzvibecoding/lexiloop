import { describe, expect, it } from "vitest";
import {
  buildQuizOptions,
  diffChars,
  gradeTyping,
  makeCloze,
  makeMatchingPairs,
  pronunciationRating,
  similarity,
} from "@/lib/study/modes";
import type { Card } from "@/types/entities";

function mk(id: string, word: string, pos = "noun", cefr: Card["cefr"] = "B1", tags: string[] = []): Card {
  const now = Date.now();
  return {
    id, deckId: "d", word, pos: [pos], meaningVi: [`nghĩa ${word}`], examples: [{ en: `I love ${word}.` }],
    synonyms: [], antonyms: [], collocations: [], wordFamily: [], tags, cefr,
    due: now, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0,
    learningSteps: 0, reps: 0, lapses: 0, state: 0, suspended: false, leech: false,
    createdAt: now, updatedAt: now,
  };
}

describe("study modes", () => {
  it("typing: exact / close / wrong", () => {
    expect(gradeTyping("resilient", "Resilient").rating).toBe(3);
    expect(gradeTyping("resilient", "resilien").rating).toBe(2);
    expect(gradeTyping("resilient", "banana").rating).toBe(1);
  });

  it("diffChars marks positions", () => {
    const d = diffChars("abc", "axc");
    expect(d[1]?.ok).toBe(false);
    expect(d[0]?.ok).toBe(true);
  });

  it("quiz prefers same pos", () => {
    const target = mk("t", "resilient", "adjective");
    const pool = [mk("a", "happy", "adjective"), mk("b", "run", "verb"), mk("c", "book", "noun"), mk("d", "sad", "adjective")];
    const opts = buildQuizOptions(target, pool, 4);
    expect(opts.map((o) => o.id)).toContain("t");
    expect(opts).toHaveLength(4);
  });

  it("cloze blanks the word", () => {
    const c = makeCloze(mk("t", "resilient"));
    expect(c.answer).toBe("resilient");
    expect(c.before + c.after).not.toContain("resilient");
  });

  it("matching pairs 8 cards max", () => {
    const cards = Array.from({ length: 10 }, (_, i) => mk(`c${i}`, `w${i}`));
    const pairs = makeMatchingPairs(cards);
    expect(pairs).toHaveLength(16);
  });

  it("pronunciation similarity + rating", () => {
    expect(similarity("resilient", "resilient")).toBe(1);
    expect(pronunciationRating(0.95)).toBe(4);
    expect(pronunciationRating(0.1)).toBe(1);
  });
});
