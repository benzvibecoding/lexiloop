"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useT } from "@/stores/prefs";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallButton() {
  const [deferred, setDeferred] = useState<BIP | null>(null);
  const t = useT();
  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIP);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (!deferred) return null;
  return (
    <button
      type="button"
      onClick={() => void deferred.prompt()}
      className="flex min-h-[44px] items-center gap-2 rounded-2xl bg-stone-900 px-4 text-sm font-bold text-white dark:bg-white dark:text-stone-900"
    >
      <Download size={18} aria-hidden />
      {t("install_app")}
    </button>
  );
}
