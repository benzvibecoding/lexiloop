import { z } from "zod";

const phoneticSchema = z.object({
  text: z.string().optional(),
  audio: z.string().optional(),
});

const definitionSchema = z.object({
  definition: z.string(),
  example: z.string().optional(),
  synonyms: z.array(z.string()).optional(),
  antonyms: z.array(z.string()).optional(),
});

const meaningSchema = z.object({
  partOfSpeech: z.string(),
  definitions: z.array(definitionSchema),
});

const entrySchema = z.array(
  z.object({
    word: z.string(),
    phonetic: z.string().optional(),
    phonetics: z.array(phoneticSchema).optional(),
    meanings: z.array(meaningSchema),
  }),
);

export type DictEntry = {
  word: string;
  ipaUs: string;
  ipaUk: string;
  audioUrl: string;
  pos: string[];
  definitionEn: string;
  examples: Array<{ en: string }>;
  synonyms: string[];
  antonyms: string[];
};

function pickAudio(phonetics: Array<{ text?: string; audio?: string }>): string {
  const withAudio = phonetics.filter((p) => p.audio && p.audio.startsWith("http"));
  return withAudio[0]?.audio ?? "";
}

export function parseFreeDict(word: string, raw: unknown): DictEntry | null {
  const parsed = entrySchema.safeParse(raw);
  if (!parsed.success || parsed.data.length === 0) return null;
  const e = parsed.data[0];
  if (!e) return null;
  const pos: string[] = [];
  let definitionEn = "";
  const examples: Array<{ en: string }> = [];
  const syn = new Set<string>();
  const ant = new Set<string>();
  for (const m of e.meanings.slice(0, 4)) {
    if (m.partOfSpeech && !pos.includes(m.partOfSpeech)) pos.push(m.partOfSpeech);
    for (const d of m.definitions.slice(0, 3)) {
      if (!definitionEn && d.definition) definitionEn = d.definition;
      if (d.example) examples.push({ en: d.example });
      for (const s of d.synonyms ?? []) syn.add(s);
      for (const a of d.antonyms ?? []) ant.add(a);
    }
  }
  const ipa = e.phonetic ?? e.phonetics?.find((p) => p.text)?.text ?? "";
  return {
    word: e.word ?? word,
    ipaUs: ipa,
    ipaUk: ipa,
    audioUrl: pickAudio(e.phonetics ?? []),
    pos: pos.slice(0, 4),
    definitionEn: definitionEn.slice(0, 500),
    examples: examples.slice(0, 4),
    synonyms: [...syn].slice(0, 12),
    antonyms: [...ant].slice(0, 12),
  };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export async function fetchFreeDict(word: string, signal?: AbortSignal): Promise<DictEntry | null> {
  const w = word.trim().toLowerCase();
  if (!w) return null;
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: unknown = await res.json();
      return parseFreeDict(w, json);
    } catch (e) {
      lastErr = e;
      if (signal?.aborted) throw e;
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Không tra được từ điển.");
}

/** Gợi ý nghĩa tiếng Việt qua MyMemory. Chỉ tham khảo, lỗi thì trả rỗng. */
export async function suggestMeaningVi(en: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(en)}&langpair=en|vi`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = (await res.json()) as { responseData?: { translatedText?: string } };
    const t = json.responseData?.translatedText?.trim() ?? "";
    if (!t || t.length > 200) return [];
    return [t];
  } catch {
    return [];
  }
}

/** Chạy tối đa `limit` tác vụ song song, hỗ trợ hủy qua AbortSignal chung. */
export async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number, signal: AbortSignal) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const ctrl = new AbortController();
  const onAbort = (): void => ctrl.abort(signal?.reason);
  if (signal?.aborted) ctrl.abort(signal.reason);
  else signal?.addEventListener("abort", onAbort, { once: true });
  async function worker(): Promise<void> {
    while (true) {
      if (ctrl.signal.aborted) throw ctrl.signal.reason;
      const idx = i;
      i += 1;
      if (idx >= items.length) return;
      const item = items[idx];
      if (item === undefined) return;
      out[idx] = await fn(item, idx, ctrl.signal);
    }
  }
  const n = Math.min(Math.max(limit, 1), items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  signal?.removeEventListener("abort", onAbort);
  return out;
}
