"use client";
/* eslint-disable react-hooks/purity -- stats snapshot is intentionally wall-clock based. */

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db/client";
import { peekSettings } from "@/lib/db/repositories";
import { forecastDue, heatmapYear, stateDistribution, trueRetention, vocabGrowth } from "@/lib/stats/compute";
import { useDbMounted, useInitSettings } from "@/stores/settings";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });

function heatColor(n: number): string {
  if (n === 0) return "bg-stone-200 dark:bg-stone-800";
  if (n < 5) return "bg-emerald-200";
  if (n < 15) return "bg-emerald-400";
  return "bg-emerald-600";
}

export default function StatsPage() {
  const mounted = useDbMounted();
  useInitSettings();
  const [deckF, setDeckF] = useState("all");
  const [tagF, setTagF] = useState("all");
  const [cefrF, setCefrF] = useState("all");
  const [range, setRange] = useState(30);

  const data = useLiveQuery(async () => {
    if (!mounted) return null;
    const db = getDb();
    const settings = await peekSettings(db);
    const [decks, cards, logs, stats] = await Promise.all([
      db.decks.toArray(),
      db.cards.toArray(),
      db.reviewLogs.toArray(),
      db.dailyStats.toArray(),
    ]);
    const alive = cards.filter((c) => c.deletedAt == null);
    const tags = [...new Set(alive.flatMap((c) => c.tags))].sort();
    return { settings, decks: decks.filter((d) => d.deletedAt == null), alive, logs, stats, tags };
  }, [mounted]);

  const filtered = useMemo(() => {
    if (!data) return null;
    const cards = data.alive.filter(
      (c) =>
        (deckF === "all" || c.deckId === deckF) &&
        (tagF === "all" || c.tags.includes(tagF)) &&
        (cefrF === "all" || c.cefr === cefrF),
    );
    const ids = new Set(cards.map((c) => c.id));
    const cutoff = Date.now() - range * 86400000;
    const logs = data.logs.filter((l) => ids.has(l.cardId) && l.reviewedAt >= cutoff && (deckF === "all" || l.deckId === deckF));
    return { cards, logs };
  }, [data, deckF, tagF, cefrF, range]);

  if (!mounted || !data || !filtered) {
    return <div aria-busy="true" className="h-48 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />;
  }

  const retention = trueRetention(filtered.logs);
  const dist = stateDistribution(filtered.cards);
  const now = Date.now();
  const forecast = forecastDue(filtered.cards, now, 30).filter((_, i) => i % 2 === 0);
  const heat = heatmapYear(data.stats, now);
  const growth = vocabGrowth(filtered.cards, Math.min(range, 90), now);
  const timeMin = Math.round(filtered.logs.length * 0.13);
  const pie = [
    { name: "Mới", value: dist.fresh, color: "#a8a29e" },
    { name: "Đang học", value: dist.learning, color: "#f59e0b" },
    { name: "Young", value: dist.young, color: "#34d399" },
    { name: "Mature", value: dist.mature, color: "#0d9488" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Thống kê</h1>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <select value={deckF} onChange={(e) => setDeckF(e.target.value)} aria-label="Lọc deck" className="min-h-[44px] rounded-xl border px-2 text-sm dark:border-stone-700 dark:bg-stone-950">
          <option value="all">Mọi deck</option>
          {data.decks.map((d) => (<option key={d.id} value={d.id}>{d.emoji} {d.name}</option>))}
        </select>
        <select value={tagF} onChange={(e) => setTagF(e.target.value)} aria-label="Lọc tag" className="min-h-[44px] rounded-xl border px-2 text-sm dark:border-stone-700 dark:bg-stone-950">
          <option value="all">Mọi tag</option>
          {data.tags.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
        <select value={cefrF} onChange={(e) => setCefrF(e.target.value)} aria-label="Lọc CEFR" className="min-h-[44px] rounded-xl border px-2 text-sm dark:border-stone-700 dark:bg-stone-950">
          <option value="all">Mọi CEFR</option>
          {["A1", "A2", "B1", "B2", "C1", "C2"].map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select value={range} onChange={(e) => setRange(Number(e.target.value))} aria-label="Khoảng thời gian" className="min-h-[44px] rounded-xl border px-2 text-sm dark:border-stone-700 dark:bg-stone-950">
          {[7, 30, 90, 365].map((r) => (<option key={r} value={r}>{r} ngày</option>))}
        </select>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-4 text-center shadow-soft dark:bg-stone-900"><p className="text-2xl font-extrabold">{retention == null ? "—" : `${Math.round(retention * 100)}%`}</p><p className="text-xs">True retention</p></div>
        <div className="rounded-3xl bg-white p-4 text-center shadow-soft dark:bg-stone-900"><p className="text-2xl font-extrabold">{filtered.logs.length}</p><p className="text-xs">Lượt ôn ({range}n)</p></div>
        <div className="rounded-3xl bg-white p-4 text-center shadow-soft dark:bg-stone-900"><p className="text-2xl font-extrabold">~{timeMin}p</p><p className="text-xs">Thời gian học</p></div>
        <div className="rounded-3xl bg-white p-4 text-center shadow-soft dark:bg-stone-900"><p className="text-2xl font-extrabold">{filtered.cards.length}</p><p className="text-xs">Vốn từ (lọc)</p></div>
      </div>

      <div className="mt-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <h2 className="font-bold">Heatmap 365 ngày</h2>
        <div className="mt-2 grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto" role="img" aria-label="Heatmap số lượt ôn mỗi ngày">
          {heat.map((h) => (<span key={h.date} title={`${h.date}: ${h.count}`} className={`size-3 rounded-sm ${heatColor(h.count)}`} />))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <h2 className="font-bold">Phân bố trạng thái</h2>
          <PieChart width={260} height={220}>
            <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {pie.map((p) => (<Cell key={p.name} fill={p.color} />))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <h2 className="font-bold">Dự báo đến hạn 30 ngày</h2>
          <BarChart width={300} height={220} data={forecast}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#f9562e" />
          </BarChart>
        </div>
      </div>

      <div className="mt-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <h2 className="font-bold">Tăng trưởng vốn từ ({Math.min(range, 90)} ngày)</h2>
        <LineChart width={640} height={200} data={growth}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={9} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#14b983" dot={false} />
        </LineChart>
      </div>
    </div>
  );
}
