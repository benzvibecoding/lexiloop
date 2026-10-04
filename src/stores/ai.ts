"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AiProvider = "gemini" | "openai";

type AiPrefs = {
  enabled: boolean;
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  set: (p: Partial<AiPrefs>) => void;
};

export const useAiPrefs = create<AiPrefs>()(
  persist(
    (set) => ({
      enabled: false,
      provider: "gemini",
      apiKey: "",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      set: (p) => set(p),
    }),
    { name: "lexiloop-ai" },
  ),
);
