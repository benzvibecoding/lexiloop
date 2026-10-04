"use client";
/* eslint-disable react-hooks/set-state-in-effect -- queue loads once from IndexedDB on mount/deck change. */

import { useCallback, useEffect, useState } from "react";
import { getDb } from "@/lib/db/client";
import { loadSettings } from "@/lib/db/repositories";
import { buildQueue, type QueueItem } from "@/lib/srs/queue";
import type { Card } from "@/types/entities";

export function useModeQueue(deckId: string | null) {
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [pool, setPool] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState("");

  const load = useCallback(async () => {
    const db = getDb();
    const settings = await loadSettings(db);
    const decks = await db.decks.toArray();
    if (deckId) {
      const d = decks.find((x) => x.id === deckId);
      setDeckName(d ? `${d.emoji} ${d.name}` : "");
    } else {
      setDeckName("Tất cả các bộ");
    }
    const cards = deckId
      ? await db.cards.where("deckId").equals(deckId).toArray()
      : await db.cards.toArray();
    setPool(cards.filter((c) => c.deletedAt == null));
    setQueue(buildQueue(cards, Date.now(), { newPerDay: settings.newPerDay, reviewPerDay: settings.reviewPerDay }));
  }, [deckId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { queue, setQueue, pool, deckName, reload: load };
}
