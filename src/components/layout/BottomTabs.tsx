"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Layers, PlusCircle, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/stores/prefs";

const tabs = [
  { href: "/review", key: "nav_learn", icon: BookOpen },
  { href: "/library", key: "nav_library", icon: Layers },
  { href: "/add", key: "nav_add", icon: PlusCircle },
  { href: "/stats", key: "nav_stats", icon: BarChart3 },
  { href: "/settings", key: "nav_settings", icon: Settings },
] as const;

export function BottomTabs() {
  const path = usePathname();
  const t = useT();
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-950/90"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, key, icon: Icon }) => {
          const active = path === href || (href === "/review" && path === "/dashboard");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs font-medium",
                  active ? "text-orange-600 dark:text-amber-300" : "text-stone-500",
                )}
              >
                <Icon size={22} aria-hidden />
                <span>{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
