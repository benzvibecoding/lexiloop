import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { z } from "zod";

const shareCardSchema = z.object({
  word: z.string().min(1).max(200),
  meaningVi: z.array(z.string().min(1).max(500)).min(1).max(8),
  pos: z.array(z.string().max(32)).max(4).optional(),
  exampleEn: z.string().max(1000).optional(),
  exampleVi: z.string().max(1000).optional(),
});

export const shareDeckSchema = z.object({
  v: z.literal(1),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  emoji: z.string().max(16).optional(),
  cards: z.array(shareCardSchema).min(1).max(500),
});

export type ShareDeck = z.infer<typeof shareDeckSchema>;

/** Nén deck thành chuỗi bỏ vào link. Deck lớn → chuỗi dài, nên dùng cho deck nhỏ. */
export function encodeShare(deck: ShareDeck): string {
  const parsed = shareDeckSchema.parse(deck);
  return compressToEncodedURIComponent(JSON.stringify(parsed));
}

export function decodeShare(s: string): ShareDeck {
  const json = decompressFromEncodedURIComponent(s);
  if (!json) throw new Error("Link chia sẻ không hợp lệ.");
  return shareDeckSchema.parse(JSON.parse(json));
}
