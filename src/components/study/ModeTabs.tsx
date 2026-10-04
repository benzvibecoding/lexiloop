"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { StudyMode } from "@/types/entities";

const MODES: Array<{ id: StudyMode | "custom"; label: string }> = [
  { id: "flashcard", label: "Flashcard" },
  { id: "learn", label: "Learn" },
  { id: "typing", label: "Gõ từ" },
  { id: "listening", label: "Nghe" },
  { id: "quiz", label: "Trắc nghiệm" },
  { id: "matching", label: "Ghép cặp" },
  { id: "cloze", label: "Cloze" },
  { id: "pronunciation", label: "Phát âm" },
  { id: "sprint", label: "Sprint" },
  { id: "custom", label: "Tùy chỉnh" },
];

export function ModeTabs() {
  const sp = useSearchParams();
  const deck = sp.get("deck");
  const cur = sp.get("mode") ?? "flashcard";
  const q = (mode: string): string => {
    const p = new URLSearchParams();
    if (deck) p.set("deck", deck);
    p.set("mode", mode);
    return `/study?${p.toString()}`;
  };
  return (
    <nav aria-label="Chế độ học" className="flex gap-1 overflow-x-auto pb-1">
      {MODES.map((m) => (
        <Link
          key={m.id}
          href={q(m.id)}
          aria-current={cur === m.id ? "page" : undefined}
          className={cn(
            "min-h-[40px] shrink-0 rounded-xl px-3 py-2 text-xs font-bold",
            cur === m.id ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900" : "border",
          )}
        >
          {m.label}
        </Link>
      ))}
    </nav>
  );
}
