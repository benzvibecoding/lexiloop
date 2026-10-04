"use client";

import { Languages } from "lucide-react";
import { usePrefs, useT } from "@/stores/prefs";

export function LocaleToggle() {
  const locale = usePrefs((s) => s.locale);
  const setLocale = usePrefs((s) => s.setLocale);
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
      aria-label={t("lang_label")}
      className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-stone-200 px-3 text-sm font-bold dark:border-stone-700"
    >
      <Languages size={18} aria-hidden />
      {locale.toUpperCase()}
    </button>
  );
}
