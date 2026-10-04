export type Clock = {
  now: () => number;
};

export const systemClock: Clock = {
  now: () => Date.now(),
};

export function fixedClock(fixedMs: number): Clock {
  return { now: () => fixedMs };
}

/** YYYY-MM-DD theo giờ địa phương + giờ đổi ngày (mặc định 04:00). */
export function dayKey(atMs: number, rolloverHour = 4): string {
  const d = new Date(atMs);
  const shifted = new Date(d);
  if (d.getHours() < rolloverHour) shifted.setDate(d.getDate() - 1);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, "0");
  const day = String(shifted.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Milisecond bắt đầu của ngày học (sau rollover). */
export function dayStartMs(atMs: number, rolloverHour = 4): number {
  const d = new Date(atMs);
  const start = new Date(d);
  start.setHours(rolloverHour, 0, 0, 0);
  if (d.getTime() < start.getTime()) start.setDate(start.getDate() - 1);
  return start.getTime();
}

export function addDaysKey(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function diffDaysKey(a: string, b: string): number {
  const pa = a.split("-").map(Number);
  const pb = b.split("-").map(Number);
  const da = new Date(pa[0] ?? 2000, (pa[1] ?? 1) - 1, pa[2] ?? 1).getTime();
  const db = new Date(pb[0] ?? 2000, (pb[1] ?? 1) - 1, pb[2] ?? 1).getTime();
  return Math.round((da - db) / 86400000);
}
