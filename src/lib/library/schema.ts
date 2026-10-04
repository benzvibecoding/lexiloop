import { z } from "zod";

export const starterCardSchema = z.object({
  word: z.string().min(1).max(200),
  pos: z.array(z.string().max(32)).default([]),
  ipa: z.string().max(120).optional(),
  meaningVi: z.array(z.string().min(1).max(500)).min(1),
  definitionEn: z.string().max(1000).optional(),
  exampleEn: z.string().max(1000).optional(),
  exampleVi: z.string().max(1000).optional(),
  synonyms: z.array(z.string().max(120)).default([]),
  tags: z.array(z.string().max(64)).default([]),
  cefr: z.enum(["A1", "A2", "B1", "B2", "C1"]).optional(),
  note: z.string().max(1000).optional(),
});

export const starterDeckSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  description: z.string().max(1000),
  emoji: z.string().min(1).max(16),
  color: z.string().min(1).max(32),
  tags: z.array(z.string().max(64)).default([]),
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  goals: z.array(z.string()).default([]),
  cards: z.array(starterCardSchema).min(1),
});

export type StarterDeck = z.infer<typeof starterDeckSchema>;
export type StarterCard = z.infer<typeof starterCardSchema>;
