import { z } from "zod";

export const placementItemSchema = z.object({
  id: z.number().int(),
  band: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
});

export const placementSchema = z.array(placementItemSchema).length(20);
export type PlacementItem = z.infer<typeof placementItemSchema>;

const BAND_ORDER = ["A1", "A2", "B1", "B2", "C1"] as const;

/** Ước lượng CEFR: band cao nhất đạt ≥3/4 câu; đúng hết C1 → C1. */
export function estimateCefr(items: PlacementItem[], answers: Array<number | null>): string {
  let level = "A1";
  for (const band of BAND_ORDER) {
    const qs = items.filter((q) => q.band === band);
    const ok = qs.filter((q) => {
      const i = items.indexOf(q);
      return answers[i] === q.answer;
    }).length;
    if (ok >= 3) level = band;
    else break;
  }
  return level;
}
