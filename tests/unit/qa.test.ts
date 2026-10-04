import "fake-indexeddb/auto";
import { describe, expect, it, beforeEach } from "vitest";
import { LexiLoopDB } from "@/lib/db/client";
import {
  bulkCreateCards,
  createCard,
  createDeck,
  loadSettings,
  newCardDefaults,
  peekSettings,
  softDeleteDeck,
  wipeAll,
} from "@/lib/db/repositories";
import { exportBackup, importBackup } from "@/lib/backup/backup";

let n = 100;
function testDb(): LexiLoopDB {
  n += 1;
  return new LexiLoopDB(`qa-${Date.now()}-${n}`);
}

describe("qa: repositories edge cases", () => {
  let db: LexiLoopDB;
  beforeEach(() => {
    db = testDb();
  });

  it("softDeleteDeck cascades to its cards", async () => {
    const deck = await createDeck(db, { name: "X", emoji: "📚", color: "coral", tags: [], archived: false });
    await createCard(db, newCardDefaults(deck.id, "hello", ["xin chào"]));
    await softDeleteDeck(db, deck.id);
    const d = await db.decks.get(deck.id);
    const cards = await db.cards.where("deckId").equals(deck.id).toArray();
    expect(d?.deletedAt).toBeDefined();
    expect(cards[0]?.deletedAt).toBeDefined();
  });

  it("wipeAll clears everything but settings", async () => {
    const deck = await createDeck(db, { name: "X", emoji: "📚", color: "coral", tags: [], archived: false });
    await bulkCreateCards(db, [newCardDefaults(deck.id, "a", ["a"]), newCardDefaults(deck.id, "b", ["b"])]);
    await wipeAll(db);
    expect(await db.decks.count()).toBe(0);
    expect(await db.cards.count()).toBe(0);
  });

  it("importBackup merge keeps existing decks", async () => {
    const mine = await createDeck(db, { name: "Mine", emoji: "📚", color: "coral", tags: [], archived: false });
    await createCard(db, newCardDefaults(mine.id, "mine-word", ["của tôi"]));
    const doc = await exportBackup(db);
    const db2 = testDb();
    const theirs = await createDeck(db2, { name: "Theirs", emoji: "📚", color: "coral", tags: [], archived: false });
    void theirs;
    const r = await importBackup(db2, JSON.parse(JSON.stringify(doc)), "merge");
    expect(r.decks).toBe(1);
    expect(await db2.decks.count()).toBe(2);
  });

  it("peekSettings never writes (safe inside liveQuery)", async () => {
    const s = await peekSettings(db);
    expect(s.newPerDay).toBeGreaterThan(0);
    expect(await db.settings.count()).toBe(0);
    const loaded = await loadSettings(db);
    expect(await db.settings.count()).toBe(1);
    expect(loaded.newPerDay).toBe(s.newPerDay);
  });
});
