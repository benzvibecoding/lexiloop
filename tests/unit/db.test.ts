import "fake-indexeddb/auto";
import { describe, expect, it, beforeEach } from "vitest";
import { LexiLoopDB } from "@/lib/db/client";
import { createDeck, createCard, newCardDefaults, searchCards, bumpDailyStat, loadSettings } from "@/lib/db/repositories";
import { exportBackup, importBackup } from "@/lib/backup/backup";

let n = 0;
function testDb(): LexiLoopDB {
  n += 1;
  return new LexiLoopDB(`test-${Date.now()}-${n}`);
}

describe("repositories + backup round-trip", () => {
  let db: LexiLoopDB;
  beforeEach(() => {
    db = testDb();
  });

  it("creates deck + card and searches", async () => {
    const deck = await createDeck(db, {
      name: "IELTS",
      emoji: "📚",
      color: "coral",
      tags: [],
      archived: false,
    });
    await createCard(db, newCardDefaults(deck.id, "resilient", ["kiên cường"]));
    const found = await searchCards(db, deck.id, "resi");
    expect(found).toHaveLength(1);
    expect(found[0]?.word).toBe("resilient");
  });

  it("backup -> wipe -> restore is lossless", async () => {
    const deck = await createDeck(db, {
      name: "TOEIC",
      emoji: "💼",
      color: "mint",
      tags: [],
      archived: false,
    });
    await createCard(db, newCardDefaults(deck.id, "deadline", ["hạn chót"]));
    await bumpDailyStat(db, Date.now(), 4, { reviews: 5, correct: 4 });
    const doc = await exportBackup(db);
    expect(doc.cards).toHaveLength(1);

    const db2 = testDb();
    const r = await importBackup(db2, JSON.parse(JSON.stringify(doc)), "replace");
    expect(r).toEqual({ decks: 1, cards: 1 });
    const settings = await loadSettings(db2);
    expect(settings.newPerDay).toBeGreaterThan(0);
  });

  it("rejects invalid backup", async () => {
    await expect(importBackup(db, { bad: true }, "replace")).rejects.toThrow();
  });
});
