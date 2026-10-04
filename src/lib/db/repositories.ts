import { nanoid } from "nanoid";
import type { LexiLoopDB } from "@/lib/db/client";
import { defaultSettings } from "@/lib/db/client";
import { cardSchema, deckSchema, dailyStatSchema, reviewLogSchema } from "@/lib/db/schemas";
import type { Card, Deck, DailyStat, ReviewLog, AppSettings, MediaRecord } from "@/types/entities";
import { dayKey, type Clock, systemClock } from "@/lib/clock/clock";

export function newId(): string {
  return nanoid();
}

export function nowUpdated(clock: Clock = systemClock): number {
  return clock.now();
}

function stripDeleted<T extends { deletedAt?: number | null }>(rows: T[]): T[] {
  return rows.filter((r) => r.deletedAt == null);
}

// ---- Decks ----
export async function listDecks(db: LexiLoopDB, includeArchived = true): Promise<Deck[]> {
  const all = await db.decks.toArray();
  const alive = stripDeleted(all);
  const filtered = includeArchived ? alive : alive.filter((d) => !d.archived);
  return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function createDeck(
  db: LexiLoopDB,
  input: Omit<Deck, "id" | "createdAt" | "updatedAt">,
  clock: Clock = systemClock,
): Promise<Deck> {
  const now = clock.now();
  const deck: Deck = { ...input, id: newId(), createdAt: now, updatedAt: now };
  const parsed = deckSchema.parse(deck);
  await db.decks.add(parsed);
  return parsed;
}

export async function updateDeck(db: LexiLoopDB, id: string, patch: Partial<Deck>): Promise<void> {
  const cur = await db.decks.get(id);
  if (!cur) throw new Error("Không tìm thấy bộ thẻ.");
  const next = deckSchema.parse({ ...cur, ...patch, id, updatedAt: Date.now() });
  await db.decks.put(next);
}

export async function softDeleteDeck(db: LexiLoopDB, id: string): Promise<void> {
  await db.transaction("rw", [db.decks, db.cards], async () => {
    const now = Date.now();
    await db.decks.update(id, { deletedAt: now, updatedAt: now });
    await db.cards.where("deckId").equals(id).modify({ deletedAt: now, updatedAt: now });
  });
}

// ---- Cards ----
export function newCardDefaults(deckId: string, word: string, meaningVi: string[]): Omit<Card, "id" | "createdAt" | "updatedAt"> {
  return {
    deckId,
    word: word.trim(),
    pos: [],
    meaningVi,
    examples: [],
    synonyms: [],
    antonyms: [],
    collocations: [],
    wordFamily: [],
    tags: [],
    due: Date.now(),
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
  };
}

export async function createCard(
  db: LexiLoopDB,
  input: Omit<Card, "id" | "createdAt" | "updatedAt">,
  clock: Clock = systemClock,
): Promise<Card> {
  const now = clock.now();
  const card: Card = { ...input, id: newId(), createdAt: now, updatedAt: now };
  const parsed = cardSchema.parse(card);
  await db.cards.add(parsed);
  return parsed;
}

export async function bulkCreateCards(
  db: LexiLoopDB,
  inputs: Array<Omit<Card, "id" | "createdAt" | "updatedAt">>,
  clock: Clock = systemClock,
): Promise<number> {
  const now = clock.now();
  const rows = inputs.map((c) =>
    cardSchema.parse({ ...c, id: newId(), createdAt: now, updatedAt: now }),
  );
  await db.cards.bulkAdd(rows);
  return rows.length;
}

export async function searchCards(
  db: LexiLoopDB,
  deckId: string | null,
  query: string,
  limit = 100,
): Promise<Card[]> {
  const q = query.trim().toLowerCase();
  let col = db.cards.toCollection();
  if (deckId) col = db.cards.where("deckId").equals(deckId);
  const all = await col.toArray();
  const alive = stripDeleted(all).filter((c) => !c.suspended);
  if (!q) return alive.slice(0, limit);
  return alive
    .filter(
      (c) =>
        c.word.toLowerCase().includes(q) ||
        c.meaningVi.some((m) => m.toLowerCase().includes(q)) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    )
    .slice(0, limit);
}

// ---- Review logs & stats ----
export async function appendReviewLog(db: LexiLoopDB, log: Omit<ReviewLog, "id">): Promise<ReviewLog> {
  const row = reviewLogSchema.parse({ ...log, id: newId() });
  await db.reviewLogs.add(row);
  return row;
}

export async function bumpDailyStat(
  db: LexiLoopDB,
  atMs: number,
  rolloverHour: number,
  patch: Partial<Pick<DailyStat, "reviews" | "newCards" | "correct" | "timeMs" | "xp">>,
): Promise<DailyStat> {
  const date = dayKey(atMs, rolloverHour);
  const cur = await db.dailyStats.get(date);
  const next: DailyStat = dailyStatSchema.parse({
    date,
    reviews: (cur?.reviews ?? 0) + (patch.reviews ?? 0),
    newCards: (cur?.newCards ?? 0) + (patch.newCards ?? 0),
    correct: (cur?.correct ?? 0) + (patch.correct ?? 0),
    timeMs: (cur?.timeMs ?? 0) + (patch.timeMs ?? 0),
    xp: (cur?.xp ?? 0) + (patch.xp ?? 0),
  });
  await db.dailyStats.put(next);
  return next;
}

// ---- Settings ----
export async function loadSettings(db: LexiLoopDB): Promise<AppSettings> {
  const cur = await db.settings.get("main");
  if (cur) return cur;
  const d = defaultSettings();
  await db.settings.add(d);
  return d;
}

/** Đọc settings không ghi (dùng trong liveQuery — cấm transaction ghi ở đó). */
export async function peekSettings(db: LexiLoopDB): Promise<AppSettings> {
  const cur = await db.settings.get("main");
  return cur ?? defaultSettings();
}

export async function saveSettings(db: LexiLoopDB, patch: Partial<AppSettings>): Promise<AppSettings> {
  const cur = await loadSettings(db);
  const next: AppSettings = { ...cur, ...patch, id: "main", updatedAt: Date.now() };
  await db.settings.put(next);
  return next;
}

// ---- Media ----
export async function putMedia(db: LexiLoopDB, data: Uint8Array | Blob, mime: string): Promise<MediaRecord> {
  const size = data instanceof Blob ? data.size : data.byteLength;
  if (size > 1024 * 1024) throw new Error("Ảnh quá lớn (tối đa 1MB sau khi nén).");
  const row: MediaRecord = { id: newId(), data, mime, size };
  await db.media.add(row);
  return row;
}

// ---- Danger zone ----
export async function wipeAll(db: LexiLoopDB): Promise<void> {
  await db.transaction("rw", [db.decks, db.cards, db.reviewLogs, db.dailyStats, db.media, db.dictCache], async () => {
    await Promise.all([
      db.decks.clear(),
      db.cards.clear(),
      db.reviewLogs.clear(),
      db.dailyStats.clear(),
      db.media.clear(),
      db.dictCache.clear(),
    ]);
  });
}
