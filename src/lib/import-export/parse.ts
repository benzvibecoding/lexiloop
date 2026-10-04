export type ImportRow = {
  word: string;
  meaningVi: string;
  pos?: string;
  exampleEn?: string;
  exampleVi?: string;
  tags?: string;
};

function splitLine(line: string, delim: string): string[] {
  // Tách CSV đơn giản có hỗ trợ ngoặc kép.
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i] ?? "";
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === delim && !inQ) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out.map((s) => s.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
}

export type ColumnMap = {
  word: number;
  meaningVi: number;
  pos?: number;
  exampleEn?: number;
  exampleVi?: number;
  tags?: number;
};

export function detectDelimiter(sample: string): "," | "\t" | ";" {
  const first = sample.split("\n")[0] ?? "";
  const tabs = (first.match(/\t/g) ?? []).length;
  const semis = (first.match(/;/g) ?? []).length;
  const commas = (first.match(/,/g) ?? []).length;
  if (tabs >= 1) return "\t";
  if (semis > commas) return ";";
  return ",";
}

export function parseDelimited(text: string, map: ColumnMap): ImportRow[] {
  const delim = detectDelimiter(text);
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => splitLine(line, delim))
    .filter((cols) => cols.length > 1 || (cols[0]?.length ?? 0) > 0)
    .map((cols) => ({
      word: cols[map.word] ?? "",
      meaningVi: cols[map.meaningVi] ?? "",
      pos: map.pos != null ? (cols[map.pos] ?? "") : undefined,
      exampleEn: map.exampleEn != null ? (cols[map.exampleEn] ?? "") : undefined,
      exampleVi: map.exampleVi != null ? (cols[map.exampleVi] ?? "") : undefined,
      tags: map.tags != null ? (cols[map.tags] ?? "") : undefined,
    }))
    .filter((r) => r.word.length > 0 && r.meaningVi.length > 0);
}

/** Dán kiểu Quizlet: "term<TAB>definition" hoặc "term - definition". */
export function parseQuizletPasted(text: string): ImportRow[] {
  const rows: ImportRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    let word = "";
    let meaning = "";
    if (t.includes("\t")) {
      const [w, ...rest] = t.split("\t");
      word = (w ?? "").trim();
      meaning = rest.join("\t").trim();
    } else if (t.includes(" - ")) {
      const idx = t.indexOf(" - ");
      word = t.slice(0, idx).trim();
      meaning = t.slice(idx + 3).trim();
    } else if (t.includes(",")) {
      const idx = t.indexOf(",");
      word = t.slice(0, idx).trim();
      meaning = t.slice(idx + 1).trim();
    } else {
      continue;
    }
    if (word && meaning) rows.push({ word, meaningVi: meaning });
  }
  return rows;
}

export type JsonCardInput = {
  word?: unknown;
  meaningVi?: unknown;
  meaning?: unknown;
  pos?: unknown;
  exampleEn?: unknown;
  tags?: unknown;
};

export function parseJsonCards(raw: unknown): ImportRow[] {
  const arr = Array.isArray(raw) ? raw : [raw];
  const rows: ImportRow[] = [];
  for (const item of arr as JsonCardInput[]) {
    if (typeof item !== "object" || item === null) continue;
    const word = typeof item.word === "string" ? item.word.trim() : "";
    const mv =
      typeof item.meaningVi === "string"
        ? item.meaningVi
        : Array.isArray(item.meaningVi)
          ? (item.meaningVi as unknown[]).filter((x) => typeof x === "string").join("; ")
          : typeof item.meaning === "string"
            ? item.meaning
            : "";
    if (!word || !mv.trim()) continue;
    rows.push({
      word,
      meaningVi: mv.trim(),
      pos: typeof item.pos === "string" ? item.pos : undefined,
      exampleEn: typeof item.exampleEn === "string" ? item.exampleEn : undefined,
      tags: typeof item.tags === "string" ? item.tags : Array.isArray(item.tags) ? (item.tags as string[]).join(",") : undefined,
    });
  }
  return rows;
}

export function findDuplicates(rows: ImportRow[], existingWords: string[]): { row: ImportRow; index: number }[] {
  const seen = new Set(existingWords.map((w) => w.trim().toLowerCase()));
  const dup: { row: ImportRow; index: number }[] = [];
  rows.forEach((r, index) => {
    const k = r.word.trim().toLowerCase();
    if (seen.has(k)) dup.push({ row: r, index });
    else seen.add(k);
  });
  return dup;
}
