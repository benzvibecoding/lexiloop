import type { LexiLoopDB } from "@/lib/db/client";
import { backupSchema, BACKUP_SCHEMA_VERSION, type BackupDoc } from "@/lib/db/schemas";
import { loadSettings } from "@/lib/db/repositories";

export function sanitizeForCsvCell(value: string): string {
  // Chống CSV injection: =, +, -, @, tab ở đầu ô.
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function cardsToCsv(rows: Array<{ word: string; meaningVi: string[] }>): string {
  const head = "word,meaningVi";
  const lines = rows.map((r) => `${sanitizeForCsvCell(r.word)},${sanitizeForCsvCell(r.meaningVi.join("; "))}`);
  return [head, ...lines].join("\n");
}

export async function exportBackup(db: LexiLoopDB): Promise<BackupDoc> {
  const [decks, cards, reviewLogs, dailyStats, dictCache] = await Promise.all([
    db.decks.toArray(),
    db.cards.toArray(),
    db.reviewLogs.toArray(),
    db.dailyStats.toArray(),
    db.dictCache.toArray(),
  ]);
  const settings = await loadSettings(db);
  const doc = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: Date.now(),
    decks,
    cards,
    reviewLogs,
    dailyStats,
    dictCache,
    settings,
  };
  return backupSchema.parse(doc);
}

export async function importBackup(db: LexiLoopDB, raw: unknown, mode: "replace" | "merge" = "replace"): Promise<{ decks: number; cards: number }> {
  const doc = backupSchema.parse(raw);
  await db.transaction("rw", [db.decks, db.cards, db.reviewLogs, db.dailyStats, db.dictCache, db.settings], async () => {
    if (mode === "replace") {
      await Promise.all([
        db.decks.clear(),
        db.cards.clear(),
        db.reviewLogs.clear(),
        db.dailyStats.clear(),
        db.dictCache.clear(),
      ]);
    }
    if (doc.decks.length > 0) await db.decks.bulkPut(doc.decks);
    if (doc.cards.length > 0) await db.cards.bulkPut(doc.cards);
    if (doc.reviewLogs.length > 0) await db.reviewLogs.bulkPut(doc.reviewLogs);
    if (doc.dailyStats.length > 0) await db.dailyStats.bulkPut(doc.dailyStats);
    if (doc.dictCache.length > 0) await db.dictCache.bulkPut(doc.dictCache);
    if (doc.settings) await db.settings.put(doc.settings);
  });
  return { decks: doc.decks.length, cards: doc.cards.length };
}

export async function getStorageUsage(): Promise<{ usedBytes: number; quotaBytes: number; persisted: boolean } | null> {
  try {
    const est = await navigator.storage.estimate();
    const persisted = await navigator.storage.persisted();
    return {
      usedBytes: est.usage ?? 0,
      quotaBytes: est.quota ?? 0,
      persisted,
    };
  } catch {
    return null;
  }
}

export async function ensurePersist(): Promise<boolean> {
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
