import { FSRS, Rating as FsrsRating, State as FsrsState, type Card as FsrsCard, type Grade } from "ts-fsrs";
import type { AppSettings, Card, Rating } from "@/types/entities";

export const RATING_TO_FSRSLABEL: Record<Rating, string> = {
  1: "Quên",
  2: "Khó",
  3: "Nhớ",
  4: "Dễ",
};

export function toFsrsGrade(r: Rating): Grade {
  switch (r) {
    case 1:
      return FsrsRating.Again as Grade;
    case 2:
      return FsrsRating.Hard as Grade;
    case 3:
      return FsrsRating.Good as Grade;
    default:
      return FsrsRating.Easy as Grade;
  }
}

function minutesToStep(m: number): `${number}m` {
  const v = Math.max(0, Math.round(m));
  return `${v}m`;
}

export function schedulerFromSettings(s: Pick<AppSettings, "desiredRetention" | "learningStepsMin" | "relearningStepsMin">): FSRS {
  return new FSRS({
    request_retention: s.desiredRetention,
    enable_fuzz: true,
    learning_steps: s.learningStepsMin.map(minutesToStep),
    relearning_steps: s.relearningStepsMin.map(minutesToStep),
  });
}

export function toFsrsCard(c: Card): FsrsCard {
  return {
    due: new Date(c.due),
    stability: c.stability,
    difficulty: c.difficulty || 0,
    elapsed_days: c.elapsedDays,
    scheduled_days: c.scheduledDays,
    learning_steps: c.learningSteps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state as unknown as FsrsState,
    last_review: c.lastReview != null ? new Date(c.lastReview) : undefined,
  };
}

export type GradeResult = {
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: 0 | 1 | 2 | 3;
  lastReview: number;
};

/** Chấm 1 thẻ bằng FSRS, trả về trạng thái mới (chưa ghi DB). */
export function gradeFsrs(
  card: Card,
  rating: Rating,
  nowMs: number,
  settings: Pick<AppSettings, "desiredRetention" | "learningStepsMin" | "relearningStepsMin">,
): GradeResult {
  const f = schedulerFromSettings(settings);
  const out = f.next(toFsrsCard(card), new Date(nowMs), toFsrsGrade(rating));
  const next = out.card;
  return {
    due: next.due.getTime(),
    stability: next.stability,
    difficulty: next.difficulty,
    elapsedDays: next.elapsed_days,
    scheduledDays: next.scheduled_days,
    learningSteps: next.learning_steps,
    reps: next.reps,
    lapses: next.lapses,
    state: next.state.valueOf() as 0 | 1 | 2 | 3,
    lastReview: nowMs,
  };
}

/** Xem trước due cho cả 4 nút (để hiện "1p / 10p / 1n / 4n"). */
export function previewDue(
  card: Card,
  nowMs: number,
  settings: Pick<AppSettings, "desiredRetention" | "learningStepsMin" | "relearningStepsMin">,
): Record<Rating, number> {
  const f = schedulerFromSettings(settings);
  const preview = f.repeat(toFsrsCard(card), new Date(nowMs));
  const get = (g: Grade): number => {
    const item = preview[g];
    return item ? item.card.due.getTime() : nowMs;
  };
  return {
    1: get(FsrsRating.Again as Grade),
    2: get(FsrsRating.Hard as Grade),
    3: get(FsrsRating.Good as Grade),
    4: get(FsrsRating.Easy as Grade),
  };
}
