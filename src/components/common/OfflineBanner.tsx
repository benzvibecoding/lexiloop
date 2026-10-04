"use client";

import { useEffect, useState } from "react";
import { useT } from "@/stores/prefs";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const t = useT();
  useEffect(() => {
    const on = () => setOffline(!navigator.onLine);
    on();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-stone-900">
      {t("offline_msg")}
    </div>
  );
}
