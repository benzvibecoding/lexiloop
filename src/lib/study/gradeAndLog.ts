import { getDb } from "@/lib/db/client";
import { appendReviewLog, bumpDailyStat, loadSettings, saveSettings } from "@/lib/db/repositories";
import { gradeFsrs } from "@/lib/srs/adapter";
import { cardSchema } from "@/lib/db/schemas";
import { dayKey } from "@/lib/clock/clock";
import { updateStreak } from "@/lib/gamification/streak";
import type { Card, Rating, StudyMode } from "@/types/entities";

export type GradeOutcome = {
  updated: Card;
  logId: string;
  xpGained: number;
};

/** Chấm 1 thẻ, ghi ReviewLog + DailyStat + XP. Cram = true thì chỉ ghi log, không đổi lịch. */
export async function gradeCardInDb(
  card: Card,
  rating: Rating,
  mode: StudyMode,
  durationMs: number,
  opts?: { cram?: boolean },
): Promise<GradeOutcome> {
  const db = getDb();
  const settings = await loadSettings(db);
  const at = Date.now();
  const wasNew = card.state === 0;
  if (opts?.cram) {
    const log = await appendReviewLog(db, {
      cardId: card.id,
      deckId: card.deckId,
      rating,
      state: card.state,
      mode,
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays: card.elapsedDays,
      scheduledDays: card.scheduledDays,
      reviewedAt: at,
      durationMs,
    });
    return { updated: card, logId: log.id, xpGained: 0 };
  }
  const graded = gradeFsrs(card, rating, at, settings);
  const leech = graded.lapses >= settings.leechThreshold ? true : card.leech;
  const updated = cardSchema.parse({ ...card, ...graded, leech, updatedAt: at });
  const log = await appendReviewLog(db, {
    cardId: card.id,
    deckId: card.deckId,
    rating,
    state: card.state,
    mode,
    due: graded.due,
    stability: graded.stability,
    difficulty: graded.difficulty,
    elapsedDays: graded.elapsedDays,
    scheduledDays: graded.scheduledDays,
    reviewedAt: at,
    durationMs,
  });
  await db.cards.put(updated);
  const gained = rating === 1 ? 0 : rating === 2 ? 5 : 10;
  await bumpDailyStat(db, at, settings.dayRolloverHour, {
    reviews: 1,
    newCards: wasNew ? 1 : 0,
    correct: rating >= 2 ? 1 : 0,
    timeMs: durationMs,
    xp: gained,
  });
  if (gained > 0) {
    const nextXp = settings.xp + gained;
    const { streak } = updateStreak(settings.streak, dayKey(at, settings.dayRolloverHour));
    await saveSettings(db, { xp: nextXp, level: Math.floor(nextXp / 200) + 1, streak });
  } else {
    const { streak } = updateStreak(settings.streak, dayKey(at, settings.dayRolloverHour));
    if (streak !== settings.streak) await saveSettings(db, { streak });
  }
  return { updated, logId: log.id, xpGained: gained };
}
