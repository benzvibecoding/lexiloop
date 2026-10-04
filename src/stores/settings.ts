"use client";

import { create } from "zustand";
import { useEffect, useSyncExternalStore } from "react";
import { getDb, defaultSettings } from "@/lib/db/client";
import { loadSettings, saveSettings } from "@/lib/db/repositories";
import type { AppSettings } from "@/types/entities";

type SettingsStore = {
  settings: AppSettings;
  ready: boolean;
  patch: (p: Partial<AppSettings>) => Promise<void>;
};

const initial = defaultSettings(0);

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: initial,
  ready: false,
  patch: async (p) => {
    const db = getDb();
    const next = await saveSettings(db, { ...get().settings, ...p });
    set({ settings: next });
  },
}));

export function useInitSettings(): boolean {
  const ready = useSettingsStore((s) => s.ready);
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const db = getDb();
        const s = await loadSettings(db);
        if (!alive) return;
        useSettingsStore.setState({ settings: s, ready: true });
      } catch {
        if (alive) useSettingsStore.setState({ ready: true });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

export function useDbMounted(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}
