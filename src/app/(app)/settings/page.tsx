"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db/client";
import { useDbMounted, useInitSettings, useSettingsStore } from "@/stores/settings";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleToggle } from "@/components/layout/LocaleToggle";
import { DataPanel } from "@/components/settings/DataPanel";
import { AiPanel } from "@/components/settings/AiPanel";
import { SyncPanel } from "@/components/settings/SyncPanel";
import { useGamePrefs } from "@/stores/game";
import { useT } from "@/stores/prefs";

function GameToggle() {
  const enabled = useGamePrefs((s) => s.enabled);
  const setEnabled = useGamePrefs((s) => s.setEnabled);
  return (
    <section className="mt-6 flex items-center justify-between rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900" aria-label="Gamification">
      <div>
        <h2 className="font-bold">Gamification (XP, streak, huy hiệu)</h2>
        <p className="text-sm text-stone-500">Tắt nếu bạn muốn học yên tĩnh, không thi đua.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled(!enabled)}
        className={`min-h-[44px] min-w-[72px] rounded-full px-4 font-bold ${enabled ? "bg-emerald-500 text-white" : "bg-stone-200"}`}
      >
        {enabled ? "Bật" : "Tắt"}
      </button>
    </section>
  );
}

export default function SettingsPage() {
  const t = useT();
  const mounted = useDbMounted();
  const ready = useInitSettings();
  const settings = useSettingsStore((s) => s.settings);
  const patch = useSettingsStore((s) => s.patch);
  const counts = useLiveQuery(async () => {    if (!mounted) return null;
    const db = getDb();
    const [decks, cards, logs] = await Promise.all([
      db.decks.count(),
      db.cards.count(),
      db.reviewLogs.count(),
    ]);
    return { decks, cards, logs };
  }, [mounted]);

  if (!mounted || !ready) {
    return (
      <div aria-busy="true">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
        <div className="mt-3 h-24 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold">{t("settings_title")}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {counts ? `${counts.decks} bộ thẻ · ${counts.cards} thẻ · ${counts.logs} lượt ôn` : "Đang tải…"}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <p className="mb-2 text-sm font-bold">{t("theme_label")}</p>
          <ThemeToggle />
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <p className="mb-2 text-sm font-bold">{t("lang_label")}</p>
          <LocaleToggle />
        </div>
      </div>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900" aria-label="Học">
        <h2 className="font-bold">Giờ đổi ngày & giới hạn & chế độ mặc định</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="text-sm font-medium">
            Chế độ học mặc định
            <select
              value={settings.defaultMode}
              onChange={(e) => void patch({ defaultMode: e.target.value as typeof settings.defaultMode })}
              className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
            >
              {["flashcard", "learn", "typing", "listening", "quiz", "matching", "cloze", "pronunciation", "sprint"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Giờ đổi ngày (0–23)
            <input
              type="number"
              min={0}
              max={23}
              value={settings.dayRolloverHour}
              onChange={(e) => void patch({ dayRolloverHour: Number(e.target.value) })}
              className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
            />
          </label>
          <label className="text-sm font-medium">
            Từ mới / ngày
            <input
              type="number"
              min={0}
              max={500}
              value={settings.newPerDay}
              onChange={(e) => void patch({ newPerDay: Number(e.target.value) })}
              className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
            />
          </label>
          <label className="text-sm font-medium">
            Ôn tập / ngày
            <input
              type="number"
              min={0}
              max={5000}
              value={settings.reviewPerDay}
              onChange={(e) => void patch({ reviewPerDay: Number(e.target.value) })}
              className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
            />
          </label>
        </div>
      </section>

      <GameToggle />

      <SyncPanel />

      <AiPanel />

      <DataPanel />
    </div>
  );
}
