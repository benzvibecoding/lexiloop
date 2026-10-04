import type { Card, Rating } from "@/types/entities";

export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Levenshtein đơn giản cho chuỗi ngắn. */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[m]![n]!;
}

export type TypingVerdict = { kind: "exact" | "close" | "wrong"; rating: Rating; distance: number };

/** Chấm gõ từ: đúng tuyệt đối = Good; sai ≤2 ký tự (và ≤30% độ dài) = Hard; còn lại = Again. */
export function gradeTyping(expected: string, typed: string): TypingVerdict {
  const e = normalizeAnswer(expected);
  const t = normalizeAnswer(typed);
  if (e === t) return { kind: "exact", rating: 3, distance: 0 };
  const d = levenshtein(e, t);
  if (d <= 2 && d <= Math.max(1, Math.floor(e.length * 0.3))) return { kind: "close", rating: 2, distance: d };
  return { kind: "wrong", rating: 1, distance: d };
}

/** Tô chỗ sai khi gõ: trả về mảng ký tự kèm đúng/sai theo vị trí. */
export function diffChars(expected: string, typed: string): Array<{ ch: string; ok: boolean }> {
  const e = normalizeAnswer(expected);
  const t = normalizeAnswer(typed);
  const out: Array<{ ch: string; ok: boolean }> = [];
  const len = Math.max(e.length, t.length);
  for (let i = 0; i < len; i++) {
    const ch = t[i] ?? "";
    out.push({ ch: ch || "＿", ok: e[i] === t[i] });
  }
  return out;
}

/** Đáp án nhiễu thông minh: ưu tiên cùng loại từ → cùng CEFR → cùng tag → ngẫu nhiên. */
export function buildQuizOptions(card: Card, pool: Card[], count = 4): Card[] {
  const others = pool.filter((c) => c.id !== card.id && c.deletedAt == null);
  const score = (c: Card): number => {
    let s = 0;
    if (c.pos.some((p) => card.pos.includes(p))) s += 3;
    if (c.cefr && c.cefr === card.cefr) s += 2;
    if (c.tags.some((t) => card.tags.includes(t))) s += 2;
    return s;
  };
  const ranked = [...others].sort((a, b) => score(b) - score(a));
  const picked = ranked.slice(0, Math.max(0, count - 1));
  // Xáo vị trí đáp án đúng
  const all = [...picked, card];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = all[i]!;
    all[i] = all[j]!;
    all[j] = t;
  }
  return all;
}

export type ClozeItem = { before: string; after: string; answer: string; hintVi: string };

/** Tạo câu cloze từ ví dụ đầu tiên chứa từ; fallback dùng nghĩa. */
export function makeCloze(card: Card): ClozeItem {
  const ex = card.examples.find((e) => e.en.toLowerCase().includes(card.word.toLowerCase())) ?? card.examples[0];
  if (!ex) {
    return { before: "Nghĩa: ", after: ` → ${card.word}`, answer: card.word, hintVi: card.meaningVi.join("; ") };
  }
  const idx = ex.en.toLowerCase().indexOf(card.word.toLowerCase());
  if (idx < 0) {
    return { before: `${ex.en} → `, after: "", answer: card.word, hintVi: card.meaningVi.join("; ") };
  }
  return {
    before: ex.en.slice(0, idx),
    after: ex.en.slice(idx + card.word.length),
    answer: card.word,
    hintVi: card.meaningVi.join("; "),
  };
}

export type MatchPair = { key: string; label: string; cardId: string; kind: "word" | "meaning" };

/** Tạo cặp ghép cho matching: mỗi thẻ -> 1 ô từ + 1 ô nghĩa. */
export function makeMatchingPairs(cards: Card[]): MatchPair[] {
  const pairs: MatchPair[] = [];
  for (const c of cards.slice(0, 8)) {
    pairs.push({ key: `${c.id}-w`, label: c.word, cardId: c.id, kind: "word" });
    pairs.push({ key: `${c.id}-m`, label: c.meaningVi[0] ?? "", cardId: c.id, kind: "meaning" });
  }
  // Xáo
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = pairs[i]!;
    pairs[i] = pairs[j]!;
    pairs[j] = t;
  }
  return pairs;
}

/** Điểm giống nhau 0–1 cho chấm phát âm (so khớp ký tự). */
export function similarity(a: string, b: string): number {
  const x = normalizeAnswer(a);
  const y = normalizeAnswer(b);
  if (!x || !y) return 0;
  const d = levenshtein(x, y);
  return 1 - d / Math.max(x.length, y.length);
}

export function pronunciationRating(sim: number): Rating {
  if (sim >= 0.9) return 4;
  if (sim >= 0.7) return 3;
  if (sim >= 0.45) return 2;
  return 1;
}
