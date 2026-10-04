/** Định dạng khoảng cách ôn lại: "1p", "10p", "3g", "2n", "1t". */
export function formatInterval(fromMs: number, toMs: number): string {
  const diff = Math.max(0, toMs - fromMs);
  const min = Math.round(diff / 60000);
  if (min < 1) return "ngay";
  if (min < 60) return `${min}p`;
  const h = Math.floor(min / 60);
  if (h < 24) {
    const r = min % 60;
    return r === 0 ? `${h}g` : `${h}g${r}p`;
  }
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}n`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}t`;
  return `${Math.floor(mo / 12)}năm`;
}
