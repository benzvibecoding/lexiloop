"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type GamePrefs = {
  enabled: boolean;
  seenBadges: string[];
  setEnabled: (v: boolean) => void;
  markSeen: (ids: string[]) => void;
};

export const useGamePrefs = create<GamePrefs>()(
  persist(
    (set) => ({
      enabled: true,
      seenBadges: [],
      setEnabled: (v) => set({ enabled: v }),
      markSeen: (ids) => set((s) => ({ seenBadges: [...new Set([...s.seenBadges, ...ids])] })),
    }),
    { name: "lexiloop-game" },
  ),
);
