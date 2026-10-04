"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/lib/i18n/dictionaries";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { DictKey } from "@/lib/i18n/dictionaries";

type Prefs = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: DictKey) => string;
};

export const usePrefs = create<Prefs>()(
  persist(
    (set, get) => ({
      locale: "vi",
      setLocale: (l) => set({ locale: l }),
      t: (k) => dictionaries[get().locale][k] ?? k,
    }),
    { name: "lexiloop-prefs" },
  ),
);

export function useT(): (k: DictKey) => string {
  const locale = usePrefs((s) => s.locale);
  return (k) => dictionaries[locale][k] ?? k;
}
