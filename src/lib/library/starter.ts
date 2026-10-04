import type { LexiLoopDB } from "@/lib/db/client";
import { newId } from "@/lib/db/repositories";
import { starterDeckSchema, type StarterDeck } from "@/lib/library/schema";

import daily from "@/data/starter-decks/daily-communication.json";
import travel from "@/data/starter-decks/travel.json";
import office from "@/data/starter-decks/office-work.json";
import toeic from "@/data/starter-decks/toeic-basic.json";
import env from "@/data/starter-decks/ielts-environment.json";
import edu from "@/data/starter-decks/ielts-education.json";
import tech from "@/data/starter-decks/ielts-technology.json";
import health from "@/data/starter-decks/ielts-health.json";
import phrasal from "@/data/starter-decks/phrasal-verbs.json";
import idioms from "@/data/starter-decks/idioms.json";
import collo from "@/data/starter-decks/collocations.json";
import irreg from "@/data/starter-decks/irregular-verbs.json";

const raw: unknown[] = [daily, travel, office, toeic, env, edu, tech, health, phrasal, idioms, collo, irreg];

export const STARTER_DECKS: StarterDeck[] = raw.map((d) => starterDeckSchema.parse(d));

export function getStarterDeck(id: string): StarterDeck | null {
  return STARTER_DECKS.find((d) => d.id === id) ?? null;
}

export type Goal = "ielts" | "toeic" | "communication" | "work" | "study-abroad";

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"] as const;

/** Gợi ý deck theo mục tiêu + trình độ (deck.level <= level+1 để hơi thử thách). */
export function suggestDecks(goal: Goal, level: string): StarterDeck[] {
  const li = Math.max(0, LEVEL_ORDER.indexOf(level as (typeof LEVEL_ORDER)[number]));
  return STARTER_DECKS.filter((d) => {
    const dl = LEVEL_ORDER.indexOf(d.level);
    const levelOk = dl <= li + 1;
    const goalOk = d.goals.includes(goal) || d.goals.includes("communication");
    return levelOk && goalOk;
  }).slice(0, 6);
}

/** Clone deck mẫu vào IndexedDB (không bao giờ ghi đè tiến độ đang có). Trả về deckId mới. */
export async function cloneStarterDeck(db: LexiLoopDB, starterId: string): Promise<{ deckId: string; cards: number }> {
  const s = getStarterDeck(starterId);
  if (!s) throw new Error("Không tìm thấy deck mẫu.");
  const now = Date.now();
  const existingNames = new Set((await db.decks.toArray()).filter((d) => d.deletedAt == null).map((d) => d.name));
  const name = existingNames.has(s.name) ? `${s.name} (bản sao)` : s.name;
  const deckId = newId();
  await db.decks.add({
    id: deckId,
    name,
    description: s.description,
    emoji: s.emoji,
    color: s.color,
    tags: [...s.tags, `starter:${s.id}`],
    archived: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  const rows = s.cards.map((c) => ({
    id: newId(),
    deckId,
    word: c.word,
    pos: c.pos,
    ipaUs: c.ipa,
    ipaUk: c.ipa,
    audioUrl: undefined,
    meaningVi: c.meaningVi,
    definitionEn: c.definitionEn,
    examples: c.exampleEn ? [{ en: c.exampleEn, vi: c.exampleVi }] : [],
    synonyms: c.synonyms,
    antonyms: [],
    collocations: [],
    wordFamily: [],
    note: c.note,
    mnemonic: undefined,
    imageId: undefined,
    tags: c.tags,
    cefr: c.cefr,
    due: now,
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    learningSteps: 0,
    reps: 0,
    lapses: 0,
    state: 0 as const,
    lastReview: undefined,
    suspended: false,
    buriedUntil: undefined,
    leech: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));
  await db.cards.bulkAdd(rows);
  return { deckId, cards: rows.length };
}
