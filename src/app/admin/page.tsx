"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { getSupabase, isSyncConfigured, syncAdapter } from "@/lib/sync/supabase";
import { useIsAdmin } from "@/components/common/Analytics";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

type Day = { date: string; views: number; signups: number; active: number };

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export default function AdminPage() {
  const admin = useIsAdmin();
  const [userId, setUserId] = useState<string | null>(null);
  const [days, setDays] = useState<Day[] | null>(null);
  const [totals, setTotals] = useState<{ decks: number; cards: number; reviews: number; board: number } | null>(null);
  const [topPaths, setTopPaths] = useState<Array<{ path: string; n: number }>>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (admin !== true) return;
    const sb = getSupabase();
    if (!sb) return;
    void syncAdapter.getUserId().then(setUserId);
    void (async () => {
      try {
        const since = Date.now() - 14 * 86400000;
        const { data: ev, error } = await sb
          .from("analytics_events")
          .select("event,path,at,user_id")
          .gte("at", since)
          .limit(5000);
        if (error) throw new Error(error.message);
        const list = (ev ?? []) as Array<{ event: string; path: string; at: number; user_id: string | null }>;
        const map = new Map<string, Day & { users: Set<string> }>();
        for (let i = 13; i >= 0; i--) {
          const k = dayKey(Date.now() - i * 86400000);
          map.set(k, { date: k.slice(5), views: 0, signups: 0, active: 0, users: new Set() });
        }
        const paths = new Map<string, number>();
        for (const e of list) {
          const k = dayKey(e.at);
          const d = map.get(k);
          if (!d) continue;
          if (e.event === "page_view") {
            d.views += 1;
            paths.set(e.path || "/", (paths.get(e.path || "/") ?? 0) + 1);
          }
          if (e.event === "signup") d.signups += 1;
          if (e.user_id) d.users.add(e.user_id);
        }
        setDays(
          [...map.values()].map((d) => ({ date: d.date, views: d.views, signups: d.signups, active: d.users.size })),
        );
        setTopPaths([...paths.entries()].map(([path, n]) => ({ path, n })).sort((a, b) => b.n - a.n).slice(0, 8));

        const [decks, cards, reviews, board] = await Promise.all([
          sb.from("decks").select("id", { count: "exact", head: true }),
          sb.from("cards").select("id", { count: "exact", head: true }),
          sb.from("review_logs").select("id", { count: "exact", head: true }),
          sb.from("leaderboard").select("user_id", { count: "exact", head: true }),
        ]);
        setTotals({
          decks: decks.count ?? 0,
          cards: cards.count ?? 0,
          reviews: reviews.count ?? 0,
          board: board.count ?? 0,
        });
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Tải số liệu thất bại.");
      }
    })();
  }, [admin]);

  if (!isSyncConfigured()) {
    return (
      <main className="mx-auto max-w-xl p-6 text-center">
        <h1 className="text-2xl font-extrabold">Quản trị</h1>
        <p className="mt-1 text-sm text-stone-500">Chưa bật đồng bộ đám mây nên chưa có số liệu.</p>
      </main>
    );
  }

  if (admin == null) {
    return <main className="mx-auto max-w-xl p-6"><div aria-busy="true" className="h-40 animate-pulse rounded-3xl bg-stone-200" /></main>;
  }

  if (admin === false || !userId) {
    return (
      <main className="mx-auto max-w-xl p-6 text-center">
        <p className="text-4xl" aria-hidden>🔒</p>
        <h1 className="mt-2 text-2xl font-extrabold">Khu vực quản trị</h1>
        <p className="mt-1 text-sm text-stone-500">Chỉ tài khoản admin mới xem được mục này.</p>
        <Link href="/settings" className="mt-4 inline-flex min-h-[48px] items-center rounded-2xl bg-orange-500 px-6 font-bold text-white">
          Đăng nhập →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold"><ShieldCheck size={24} aria-hidden /> Quản trị</h1>
      {msg ? <p role="alert" className="mt-2 text-sm text-red-600">{msg}</p> : null}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { t: totals?.decks ?? "…", d: "Bộ thẻ" },
          { t: totals?.cards ?? "…", d: "Thẻ" },
          { t: totals?.reviews ?? "…", d: "Lượt ôn" },
          { t: totals?.board ?? "…", d: "Người đua BXH" },
        ].map((c) => (
          <div key={c.d} className="rounded-3xl bg-white p-4 text-center shadow-soft dark:bg-stone-900">
            <p className="text-2xl font-extrabold">{c.t}</p>
            <p className="text-xs">{c.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <h2 className="font-bold">Lượt xem + đăng ký 14 ngày</h2>
        {!days ? (
          <div aria-busy="true" className="h-40 animate-pulse rounded-2xl bg-stone-100" />
        ) : (
          <BarChart width={640} height={220} data={days}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="views" fill="#f9562e" name="Lượt xem" />
            <Bar dataKey="signups" fill="#14b983" name="Đăng ký" />
          </BarChart>
        )}
      </div>
      <div className="mt-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <h2 className="font-bold">Trang được xem nhiều</h2>
        <ul className="mt-2 text-sm">
          {topPaths.map((p) => (
            <li key={p.path} className="flex justify-between border-b border-stone-100 py-1 dark:border-stone-800">
              <span className="font-mono">{p.path || "/"}</span><span className="font-bold">{p.n}</span>
            </li>
          ))}
          {topPaths.length === 0 ? <li className="text-stone-500">Chưa có dữ liệu.</li> : null}
        </ul>
      </div>
    </main>
  );
}
