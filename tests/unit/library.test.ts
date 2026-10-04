import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { STARTER_DECKS, cloneStarterDeck, getStarterDeck, suggestDecks } from "@/lib/library/starter";
import { starterDeckSchema } from "@/lib/library/schema";
import { LexiLoopDB } from "@/lib/db/client";
import { estimateCefr, placementSchema } from "@/lib/placement";
import placementRaw from "@/data/placement.json";

describe("starter library", () => {
  it("has >= 12 decks and >= 400 cards total", () => {
    expect(STARTER_DECKS.length).toBeGreaterThanOrEqual(12);
    const total = STARTER_DECKS.reduce((a, d) => a + d.cards.length, 0);
    expect(total).toBeGreaterThanOrEqual(400);
  });

  it("every deck validates and has accurate-looking content", () => {
    for (const d of STARTER_DECKS) {
      const parsed = starterDeckSchema.safeParse(d);
      expect(parsed.success, d.id).toBe(true);
      for (const c of d.cards) {
        expect(c.word.trim().length).toBeGreaterThan(0);
        expect(c.meaningVi.length).toBeGreaterThan(0);
      }
    }
  });

  it("suggests decks by goal + level", () => {
    const s = suggestDecks("ielts", "B1");
    expect(s.length).toBeGreaterThan(0);
  });

  it("clones without overwriting progress", async () => {
    const db = new LexiLoopDB(`lib-test-${Date.now()}`);
    const first = getStarterDeck("daily-communication");
    expect(first).not.toBeNull();
    const r1 = await cloneStarterDeck(db, "daily-communication");
    const r2 = await cloneStarterDeck(db, "daily-communication");
    expect(r1.cards).toBe(first!.cards.length);
    expect(r2.cards).toBe(first!.cards.length);
    const decks = await db.decks.toArray();
    expect(decks).toHaveLength(2);
    expect(decks[0]?.name).not.toBe(decks[1]?.name);
  });
});

describe("placement", () => {
  it("has 20 valid questions", () => {
    const items = placementSchema.parse(placementRaw);
    expect(items).toHaveLength(20);
  });

  it("estimates CEFR from bands", () => {
    const items = placementSchema.parse(placementRaw);
    const allRight = items.map((q) => q.answer);
    expect(estimateCefr(items, allRight)).toBe("C1");
    const onlyA1 = items.map((q) => (q.band === "A1" ? q.answer : (q.answer + 1) % 4));
    expect(estimateCefr(items, onlyA1)).toBe("A1");
  });
});
