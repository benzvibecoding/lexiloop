"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useT } from "@/stores/prefs";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${t("theme_label")}: ${t(
        theme === "light" ? "theme_light" : theme === "dark" ? "theme_dark" : "theme_system",
      )}`}
      className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-stone-200 px-3 text-sm font-medium dark:border-stone-700"
    >
      <Icon size={18} aria-hidden />
      <span className="hidden lg:inline">
        {t(theme === "light" ? "theme_light" : theme === "dark" ? "theme_dark" : "theme_system")}
      </span>
    </button>
  );
}
