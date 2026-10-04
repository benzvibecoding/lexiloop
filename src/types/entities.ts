export type Rating = 1 | 2 | 3 | 4;
export type CardState = 0 | 1 | 2 | 3;
export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type StudyMode =
  | "flashcard"
  | "learn"
  | "typing"
  | "listening"
  | "quiz"
  | "matching"
  | "cloze"
  | "pronunciation"
  | "sprint";

export interface DeckSettings {
  newPerDay?: number;
  reviewPerDay?: number;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  color: string;
  tags: string[];
  archived: boolean;
  settings?: DeckSettings;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface CardExample {
  en: string;
  vi?: string;
}

export interface Card {
  id: string;
  deckId: string;
  word: string;
  pos: string[];
  ipaUk?: string;
  ipaUs?: string;
  audioUrl?: string;
  meaningVi: string[];
  definitionEn?: string;
  examples: CardExample[];
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  wordFamily: string[];
  note?: string;
  mnemonic?: string;
  imageId?: string;
  tags: string[];
  cefr?: Cefr;
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: CardState;
  lastReview?: number;
  suspended: boolean;
  buriedUntil?: number;
  leech: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: Rating;
  state: CardState;
  mode: StudyMode;
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reviewedAt: number;
  durationMs: number;
}

export interface DailyStat {
  date: string;
  reviews: number;
  newCards: number;
  correct: number;
  timeMs: number;
  xp: number;
}

export interface MediaBlob {
  id: string;
  blob: Blob;
  mime: string;
  size: number;
}

export interface MediaRecord {
  id: string;
  data: Uint8Array | Blob;
  mime: string;
  size: number;
}

export interface DictCache {
  word: string;
  data: unknown;
  fetchedAt: number;
}

export interface StreakState {
  current: number;
  best: number;
  freezes: number;
  lastStudyDate: string | null;
}

export interface AppSettings {
  id: "main";
  onboardingDone: boolean;
  newPerDay: number;
  reviewPerDay: number;
  desiredRetention: number;
  learningStepsMin: number[];
  relearningStepsMin: number[];
  dayRolloverHour: number;
  leechThreshold: number;
  ttsVoice?: string;
  ttsRate: number;
  ttsAutoplay: boolean;
  defaultMode: StudyMode;
  frontSide: "word" | "meaning" | "audio" | "cloze";
  xp: number;
  level: number;
  streak: StreakState;
  updatedAt: number;
}
