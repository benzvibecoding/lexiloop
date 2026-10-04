"use client";

import { useEffect, useState } from "react";
import { useT } from "@/stores/prefs";

export function UpdateBanner() {
  const [show, setShow] = useState(false);
  const t = useT();
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => setShow(true));
    }
  }, []);
  if (!show) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-3 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
      <span>{t("update_msg")}</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-[44px] rounded-xl bg-white/20 px-3 font-bold"
      >
        {t("update_reload")}
      </button>
    </div>
  );
}
