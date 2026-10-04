"use client";

import { getSupabase, isSyncConfigured } from "@/lib/sync/supabase";

export type TrackEvent = "page_view" | "signup" | "review_day";

const seenPaths = new Set<string>();

/** Gửi event ẩn danh (fire-and-forget). Chỉ chạy khi đã cấu hình sync. */
export function track(event: TrackEvent, path = ""): void {
  try {
    if (!isSyncConfigured()) return;
    if (event === "page_view") {
      if (seenPaths.has(path)) return;
      seenPaths.add(path);
    }
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth.getUser().then(({ data }) => {
      void sb
        .from("analytics_events")
        .insert({ user_id: data.user?.id ?? null, event, path: path.slice(0, 200), at: Date.now() })
        .then(() => undefined);
    });
  } catch {
    // tracking không bao giờ được làm hỏng app
  }
}

export function trackOncePerDay(event: Extract<TrackEvent, "review_day">): void {
  try {
    const key = `lexiloop-track-${event}`;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key) === today) return;
    localStorage.setItem(key, today);
    track(event);
  } catch {
    // bỏ qua
  }
}
