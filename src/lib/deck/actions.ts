import type { LexiLoopDB } from "@/lib/db/client";
import { deckSchema, cardSchema } from "@/lib/db/schemas";
import { newId } from "@/lib/db/repositories";

export const DECK_COLORS = ["coral", "mint", "amber", "sky", "rose", "violet"] as const;
export const DECK_EMOJIS = ["📚", "💼", "✈️", "💬", "🧠", "🎮", "🌱", "⚡"] as const;

export async function duplicateDeck(db: LexiLoopDB, deckId: string): Promise<string> {
  const deck = await db.decks.get(deckId);
  if (!deck) throw new Error("Không tìm thấy bộ thẻ.");
  const now = Date.now();
  const newDeckId = newId();
  const newDeck = deckSchema.parse({
    ...deck,
    id: newDeckId,
    name: `${deck.name} (bản sao)`,
    archived: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  const cards = await db.cards.where("deckId").equals(deckId).toArray();
  const newCards = cards
    .filter((c) => c.deletedAt == null)
    .map((c) =>
      cardSchema.parse({
        ...c,
        id: newId(),
        deckId: newDeckId,
        // Reset SRS khi nhân bản để học lại từ đầu
        due: now,
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        learningSteps: 0,
        reps: 0,
        lapses: 0,
        state: 0,
        lastReview: undefined,
        suspended: false,
        buriedUntil: undefined,
        leech: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }),
    );
  await db.transaction("rw", [db.decks, db.cards], async () => {
    await db.decks.add(newDeck);
    if (newCards.length > 0) await db.cards.bulkAdd(newCards);
  });
  return newDeckId;
}

export async function resetCardProgress(db: LexiLoopDB, cardIds: string[]): Promise<void> {
  const now = Date.now();
  await db.cards.where("id").anyOf(cardIds).modify({
    due: now,
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    learningSteps: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    lastReview: undefined,
    leech: false,
    updatedAt: now,
  });
}
