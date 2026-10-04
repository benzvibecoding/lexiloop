"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { getSupabase, isSyncConfigured, syncAdapter } from "@/lib/sync/supabase";

type Row = { user_id: string; display_name: string; xp: number; streak: number };

/** Bảng xếp hạng XP + streak. Chỉ member đăng nhập mới xem được (guest xem sẽ thấy nút đăng nhập). */
export default function LeaderboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isSyncConfigured()) return;
    void syncAdapter.getUserId().then((id) => {
      setUserId(id);
      if (!id) return;
      const sb = getSupabase();
      if (!sb) return;
      void sb
        .from("leaderboard")
        .select("user_id,display_name,xp,streak")
        .order("xp", { ascending: false })
        .limit(20)
        .then(({ data, error }) => {
          if (error) setMsg(error.message);
          else setRows((data ?? []) as Row[]);
        });
    });
  }, []);

  if (!isSyncConfigured()) {
    return (
      <main className="mx-auto max-w-xl p-6 text-center">
        <p className="text-4xl" aria-hidden>🏆</p>
        <h1 className="mt-2 text-2xl font-extrabold">Bảng xếp hạng</h1>
        <p className="mt-1 text-sm text-stone-500">Chủ app chưa bật đồng bộ đám mây nên chưa có bảng xếp hạng.</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="mx-auto max-w-xl p-6 text-center">
        <p className="text-4xl" aria-hidden>🔒</p>
        <h1 className="mt-2 text-2xl font-extrabold">Dành cho thành viên</h1>
        <p className="mt-1 text-sm text-stone-500">Đăng nhập để giữ chuỗi khi đổi máy và đua top với mọi người. Dùng ngay không cần tài khoản thì chuỗi chỉ nằm trên máy này.</p>
        <Link href="/settings" className="mt-4 inline-flex min-h-[48px] items-center rounded-2xl bg-orange-500 px-6 font-bold text-white">
          Đăng nhập →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold"><Trophy size={24} aria-hidden /> Bảng xếp hạng</h1>
      <p className="text-sm text-stone-500">Top XP tích lũy · bật “Hiện tên tôi” trong Cài đặt để lên bảng.</p>
      {msg ? <p role="alert" className="mt-2 text-sm text-red-600">{msg}</p> : null}
      {!rows ? (
        <div aria-busy="true" className="mt-3 h-40 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm">Chưa có ai — học vài thẻ rồi sync để lên top đầu!</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {rows.map((r, i) => (
            <li key={r.user_id} className={`flex items-center gap-3 rounded-2xl p-3 ${r.user_id === userId ? "bg-orange-100 dark:bg-orange-950" : "bg-white dark:bg-stone-900"}`}>
              <span className="w-8 text-center font-extrabold">{i + 1}</span>
              <span className="flex-1 font-bold">{r.display_name}{r.user_id === userId ? " (bạn)" : ""}</span>
              <span className="text-sm">🔥{r.streak}</span>
              <span className="text-sm font-bold">{r.xp} XP</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
