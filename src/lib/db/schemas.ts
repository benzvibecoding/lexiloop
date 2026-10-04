import { z } from "zod";

export const deckSettingsSchema = z.object({
  newPerDay: z.number().int().min(0).max(999).optional(),
  reviewPerDay: z.number().int().min(0).max(5000).optional(),
});

export const deckSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  emoji: z.string().min(1).max(16),
  color: z.string().min(1).max(32),
  tags: z.array(z.string().max(64)).default([]),
  archived: z.boolean(),
  settings: deckSettingsSchema.optional(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  deletedAt: z.number().int().nullable().optional(),
});

export const cardExampleSchema = z.object({
  en: z.string().min(1).max(1000),
  vi: z.string().max(1000).optional(),
});

export const cardSchema = z.object({
  id: z.string().min(1),
  deckId: z.string().min(1),
  word: z.string().min(1).max(200),
  pos: z.array(z.string().max(32)).default([]),
  ipaUk: z.string().max(120).optional(),
  ipaUs: z.string().max(120).optional(),
  audioUrl: z.string().max(2000).optional(),
  meaningVi: z.array(z.string().min(1).max(500)).min(1),
  definitionEn: z.string().max(2000).optional(),
  examples: z.array(cardExampleSchema).default([]),
  synonyms: z.array(z.string().max(120)).default([]),
  antonyms: z.array(z.string().max(120)).default([]),
  collocations: z.array(z.string().max(200)).default([]),
  wordFamily: z.array(z.string().max(120)).default([]),
  note: z.string().max(5000).optional(),
  mnemonic: z.string().max(5000).optional(),
  imageId: z.string().optional(),
  tags: z.array(z.string().max(64)).default([]),
  cefr: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  due: z.number().int(),
  stability: z.number().min(0),
  difficulty: z.number().min(0),
  elapsedDays: z.number().int().min(0),
  scheduledDays: z.number().int().min(0),
  learningSteps: z.number().int().min(0),
  reps: z.number().int().min(0),
  lapses: z.number().int().min(0),
  state: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  lastReview: z.number().int().optional(),
  suspended: z.boolean(),
  buriedUntil: z.number().int().optional(),
  leech: z.boolean(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  deletedAt: z.number().int().nullable().optional(),
});

export const reviewLogSchema = z.object({
  id: z.string().min(1),
  cardId: z.string().min(1),
  deckId: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  state: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  mode: z.enum([
    "flashcard",
    "learn",
    "typing",
    "listening",
    "quiz",
    "matching",
    "cloze",
    "pronunciation",
    "sprint",
  ]),
  due: z.number().int(),
  stability: z.number(),
  difficulty: z.number(),
  elapsedDays: z.number().int(),
  scheduledDays: z.number().int(),
  reviewedAt: z.number().int(),
  durationMs: z.number().int().min(0),
});

export const dailyStatSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviews: z.number().int().min(0),
  newCards: z.number().int().min(0),
  correct: z.number().int().min(0),
  timeMs: z.number().int().min(0),
  xp: z.number().int().min(0),
});

export const dictCacheSchema = z.object({
  word: z.string().min(1),
  data: z.unknown(),
  fetchedAt: z.number().int(),
});

export const streakSchema = z.object({
  current: z.number().int().min(0),
  best: z.number().int().min(0),
  freezes: z.number().int().min(0),
  lastStudyDate: z.string().nullable(),
});

export const settingsSchema = z.object({
  id: z.literal("main"),
  onboardingDone: z.boolean(),
  newPerDay: z.number().int().min(0).max(500),
  reviewPerDay: z.number().int().min(0).max(5000),
  dailyGoalReviews: z.number().int().min(1).max(500).default(20),
  desiredRetention: z.number().min(0.8).max(0.97),
  learningStepsMin: z.array(z.number().min(0)).default([1, 10]),
  relearningStepsMin: z.array(z.number().min(0)).default([10]),
  dayRolloverHour: z.number().int().min(0).max(23),
  leechThreshold: z.number().int().min(1).max(32),
  ttsVoice: z.string().optional(),
  ttsRate: z.number().min(0.5).max(2),
  ttsAutoplay: z.boolean(),
  defaultMode: reviewLogSchema.shape.mode,
  frontSide: z.enum(["word", "meaning", "audio", "cloze"]),
  displayName: z.string().max(60).optional(),
  boardOptIn: z.boolean().default(false),
  xp: z.number().int().min(0),
  level: z.number().int().min(1),
  streak: streakSchema,
  updatedAt: z.number().int(),
});

export const BACKUP_SCHEMA_VERSION = 1;

export const backupSchema = z.object({
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: z.number().int(),
  decks: z.array(deckSchema),
  cards: z.array(cardSchema),
  reviewLogs: z.array(reviewLogSchema),
  dailyStats: z.array(dailyStatSchema),
  dictCache: z.array(dictCacheSchema),
  settings: settingsSchema.nullable(),
});

export type BackupDoc = z.infer<typeof backupSchema>;
