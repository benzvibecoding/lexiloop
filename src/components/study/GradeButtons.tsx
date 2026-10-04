"use client";

import { XCircle, AlertTriangle, CheckCircle2, Star } from "lucide-react";
import { formatInterval } from "@/lib/srs/format";
import type { Rating } from "@/types/entities";
import { cn } from "@/lib/utils";

export const GRADES: Array<{ rating: Rating; label: string; icon: typeof XCircle; cls: string }> = [
  { rating: 1, label: "Quên", icon: XCircle, cls: "bg-red-600" },
  { rating: 2, label: "Khó", icon: AlertTriangle, cls: "bg-amber-600" },
  { rating: 3, label: "Nhớ", icon: CheckCircle2, cls: "bg-emerald-600" },
  { rating: 4, label: "Dễ", icon: Star, cls: "bg-sky-600" },
];

export function GradeButtons({
  dueMap,
  nowMs,
  disabled,
  onGrade,
}: {
  dueMap: Record<Rating, number> | null;
  nowMs: number;
  disabled: boolean;
  onGrade: (r: Rating) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Chấm điểm ghi nhớ">
      {GRADES.map(({ rating, label, icon: Icon, cls }) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          onClick={() => onGrade(rating)}
          aria-keyshortcuts={String(rating)}
          aria-label={`${label} (${rating})${dueMap ? `, ôn lại sau ${formatInterval(nowMs, dueMap[rating])}` : ""}`}
          className={cn(
            "flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-2xl font-bold text-white disabled:opacity-40",
            cls,
          )}
        >
          <Icon size={20} aria-hidden />
          <span className="text-sm">{label}</span>
          <span className="text-[11px] font-medium opacity-90">
            {rating} · {dueMap ? formatInterval(nowMs, dueMap[rating]) : "…"}
          </span>
        </button>
      ))}
    </div>
  );
}
