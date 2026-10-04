import Dexie, { type Table } from "dexie";
import type { Card, DailyStat, Deck, DictCache, AppSettings, ReviewLog } from "@/types/entities";
import type { MediaRecord } from "@/types/entities";

export const DB_NAME = "lexiloop";
export const DB_VERSION = 2;

export class LexiLoopDB extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;
  reviewLogs!: Table<ReviewLog, string>;
  dailyStats!: Table<DailyStat, string>;
  media!: Table<MediaRecord, string>;
  dictCache!: Table<DictCache, string>;
  settings!: Table<AppSettings, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      decks: "id, updatedAt, *tags",
      cards: "id, deckId, due, state, word, [deckId+state], [deckId+due], *tags",
      reviewLogs: "id, cardId, deckId, reviewedAt",
      dailyStats: "date",
      media: "id",
      dictCache: "word",
      settings: "id",
    });
    // v2: thêm dailyGoalReviews cho settings (không đổi index)
    this.version(2)
      .stores({
        decks: "id, updatedAt, *tags",
        cards: "id, deckId, due, state, word, [deckId+state], [deckId+due], *tags",
        reviewLogs: "id, cardId, deckId, reviewedAt",
        dailyStats: "date",
        media: "id",
        dictCache: "word",
        settings: "id",
      })
      .upgrade((tx) =>
        tx
          .table("settings")
          .toCollection()
          .modify((s: Record<string, unknown>) => {
            if (s["dailyGoalReviews"] == null) s["dailyGoalReviews"] = 20;
            if (s["boardOptIn"] == null) s["boardOptIn"] = false;
          }),
      );
  }
}

let cached: LexiLoopDB | null = null;

export function getDb(name = DB_NAME): LexiLoopDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB chỉ dùng được trên client.");
  }
  if (name !== DB_NAME && name.length > 0) return new LexiLoopDB(name);
  if (!cached) cached = new LexiLoopDB(name);
  return cached;
}

export function defaultSettings(now = Date.now()): AppSettings {
  return {
    id: "main",
    onboardingDone: false,
    newPerDay: 10,
    reviewPerDay: 200,
    dailyGoalReviews: 20,
    desiredRetention: 0.9,
    learningStepsMin: [1, 10],
    relearningStepsMin: [10],
    dayRolloverHour: 4,
    leechThreshold: 8,
    ttsRate: 1,
    ttsAutoplay: true,
    defaultMode: "flashcard",
    frontSide: "word",
    boardOptIn: false,
    xp: 0,
    level: 1,
    streak: { current: 0, best: 0, freezes: 0, lastStudyDate: null },
    updatedAt: now,
  };
}
