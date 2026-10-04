"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabase, isSyncConfigured } from "@/lib/sync/supabase";
import { track } from "@/lib/analytics";

/** Gửi page_view mỗi khi đổi trang (mỗi path 1 lần/phiên). */
export function AnalyticsTracker() {
  const path = usePathname();
  useEffect(() => {
    if (path) track("page_view", path);
  }, [path]);
  return null;
}

/** true khi user hiện tại có dòng trong bảng admins. Cache theo phiên. */
export function useIsAdmin(): boolean | null {
  const [admin, setAdmin] = useState<boolean | null>(() => (isSyncConfigured() ? null : false));
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) {
        setAdmin(false);
        return;
      }
      void sb
        .from("admins")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle()
        .then(({ data: row }) => setAdmin(row != null));
    });
  }, []);
  return admin;
}
