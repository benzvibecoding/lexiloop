"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { isSyncConfigured, syncAdapter } from "@/lib/sync/supabase";

function lastSync(): number | null {
  try {
    const v = localStorage.getItem("lexiloop-last-sync");
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

/** Ẩn hoàn toàn khi thiếu env (guest mode). */
export function SyncPanel() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [at, setAt] = useState<number | null>(() => lastSync());

  useEffect(() => {
    if (!isSyncConfigured()) return;
    void syncAdapter.getUserId().then(setUserId);
    return syncAdapter.onAuthChange((id) => {
      setUserId(id);
      if (id) void syncAdapter.syncNow().then((r) => setAt(r.at)).catch(() => undefined);
    });
  }, []);

  if (!isSyncConfigured()) return null;

  async function sync(): Promise<void> {
    setBusy(true);
    setMsg("");
    try {
      const r = await syncAdapter.syncNow();
      setAt(r.at);
      setMsg(`Đã đồng bộ: đẩy ${r.pushed}, kéo ${r.pulled}.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Đồng bộ thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900" aria-label="Đồng bộ đám mây">
      <h2 className="flex items-center gap-2 font-bold">
        {userId ? <Cloud size={18} aria-hidden /> : <CloudOff size={18} aria-hidden />}
        Đồng bộ đám mây (tùy chọn)
      </h2>
      {!userId ? (
        <div className="mt-3">
          <p className="text-sm text-stone-500">Đăng nhập để sync giữa các máy. Không đăng nhập app vẫn chạy bình thường.</p>
          <div className="mt-2 flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email của bạn"
              aria-label="Email đăng nhập"
              className="min-h-[44px] flex-1 rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
            />
            <button
              type="button"
              onClick={() => syncAdapter.signInWithEmail(email.trim()).then(() => setMsg("Đã gửi link đăng nhập — kiểm tra email.")).catch((e: unknown) => setMsg(e instanceof Error ? e.message : "Lỗi."))}
              className="min-h-[44px] rounded-2xl bg-stone-900 px-4 text-sm font-bold text-white dark:bg-white dark:text-stone-900"
            >
              Gửi link
            </button>
          </div>
          <button
            type="button"
            onClick={() => syncAdapter.signInWithGoogle().catch((e: unknown) => setMsg(e instanceof Error ? e.message : "Lỗi."))}
            className="mt-2 min-h-[44px] w-full rounded-2xl border text-sm font-bold"
          >
            Đăng nhập bằng Google
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-stone-500">Đã đăng nhập · sync gần nhất: {at ? new Date(at).toLocaleString("vi-VN") : "chưa"}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void sync()}
              disabled={busy}
              className="flex min-h-[44px] items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              <RefreshCw size={16} aria-hidden className={busy ? "animate-spin" : ""} />
              {busy ? "Đang sync…" : "Sync ngay"}
            </button>
            <button
              type="button"
              onClick={() => void syncAdapter.signOut().then(() => setUserId(null))}
              className="min-h-[44px] rounded-2xl border px-4 text-sm font-bold"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
      {msg ? <p role="status" className="mt-2 text-sm font-medium">{msg}</p> : null}
    </section>
  );
}

/** Tự sync khi mở app / có mạng lại (debounce, chỉ khi đã đăng nhập). */
export function AutoSync() {
  useEffect(() => {
    if (!isSyncConfigured()) return;
    let timer: number | undefined;
    const run = (): void => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void syncAdapter.getUserId().then((id) => {
          if (id) void syncAdapter.syncNow().catch(() => undefined);
        });
      }, 5000);
    };
    run();
    window.addEventListener("online", run);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", run);
    };
  }, []);
  return null;
}
