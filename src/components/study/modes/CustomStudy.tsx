"use client";
/* eslint-disable react-hooks/purity -- custom-study preview count is wall-clock based. */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db/client";
import { useDbMounted } from "@/stores/settings";

/** Custom study: ôn trước N ngày / cram không đổi lịch / chỉ thẻ sai-leech-khó / theo tag. */
export function CustomStudy() {
  const mounted = useDbMounted();
  const [ahead, setAhead] = useState(3);
  const [onlyHard, setOnlyHard] = useState(false);
  const [onlyLeech, setOnlyLeech] = useState(false);
  const [tag, setTag] = useState("all");
  const [cram, setCram] = useState(false);

  const data = useLiveQuery(async () => {
    if (!mounted) return null;
    const db = getDb();
    const [cards, decks] = await Promise.all([db.cards.toArray(), db.decks.toArray()]);
    const alive = cards.filter((c) => c.deletedAt == null && !c.suspended);
    const tags = [...new Set(alive.flatMap((c) => c.tags))].sort();
    return { alive, tags, decks: decks.filter((d) => d.deletedAt == null) };
  }, [mounted]);

  const count = useMemo(() => {
    if (!data) return 0;
    const now = Date.now();
    const horizon = now + ahead * 86400000;
    return data.alive.filter((c) => {
      if (tag !== "all" && !c.tags.includes(tag)) return false;
      if (onlyLeech && !c.leech) return false;
      if (onlyHard && !(c.lapses >= 3 || c.state === 3)) return false;
      return c.due <= horizon;
    }).length;
  }, [data, ahead, tag, onlyHard, onlyLeech]);

  const href = useMemo(() => {
    const p = new URLSearchParams({
      mode: "flashcard",
      ahead: String(ahead),
      tag,
      hard: onlyHard ? "1" : "0",
      leech: onlyLeech ? "1" : "0",
      cram: cram ? "1" : "0",
    });
    return `/study?${p.toString()}`;
  }, [ahead, tag, onlyHard, onlyLeech, cram]);

  if (!mounted || !data) return <div aria-busy="true" className="h-32 animate-pulse rounded-3xl bg-stone-200" />;

  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-5 shadow-card dark:bg-stone-900">
      <h2 className="font-extrabold">Ôn tùy chỉnh</h2>
      <div className="mt-3 grid gap-3">
        <label className="text-sm font-medium">Ôn trước (ngày tới)
          <input type="number" min={0} max={30} value={ahead} onChange={(e) => setAhead(Number(e.target.value))} className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950" />
        </label>
        <label className="text-sm font-medium">Theo tag
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950">
            <option value="all">Mọi tag</option>
            {data.tags.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyHard} onChange={(e) => setOnlyHard(e.target.checked)} /> Chỉ thẻ sai nhiều / khó</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyLeech} onChange={(e) => setOnlyLeech(e.target.checked)} /> Chỉ thẻ leech</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cram} onChange={(e) => setCram(e.target.checked)} /> Cram (ôn nhồi, không đổi lịch)</label>
      </div>
      <p className="mt-2 text-sm">Sẽ ôn khoảng <b>{count}</b> thẻ.</p>
      <Link href={href} className="mt-3 flex min-h-[48px] items-center justify-center rounded-2xl bg-orange-500 font-bold text-white">Bắt đầu ôn tùy chỉnh →</Link>
      {cram ? <p className="mt-1 text-xs text-stone-500">Cram chỉ ghi log, không thay đổi lịch FSRS.</p> : null}
    </div>
  );
}
