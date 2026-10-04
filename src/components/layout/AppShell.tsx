"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, LayoutDashboard, Layers, Search, PlusCircle, BarChart3, Settings, BookMarked } from "lucide-react";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleToggle } from "@/components/layout/LocaleToggle";
import { BottomTabs } from "@/components/layout/BottomTabs";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { UpdateBanner } from "@/components/common/UpdateBanner";

const side = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/review", label: "Ôn tập", icon: BookOpenText },
  { href: "/decks", label: "Bộ thẻ", icon: Layers },
  { href: "/library", label: "Thư viện", icon: Search },
  { href: "/lookup", label: "Tra từ", icon: BookMarked },
  { href: "/add", label: "Thêm thẻ", icon: PlusCircle },
  { href: "/stats", label: "Thống kê", icon: BarChart3 },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-stone-200 p-4 md:flex dark:border-stone-800">
        <Link href="/" className="mb-4 flex items-center gap-2 rounded-2xl bg-cream-100 p-3 shadow-soft dark:bg-stone-900">
          <span aria-hidden className="text-2xl">🔁</span>
          <span className="font-extrabold">{site.name}</span>
        </Link>
        {side.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium",
              path === href
                ? "bg-orange-500 text-white"
                : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-900",
            )}
          >
            <Icon size={20} aria-hidden />
            {label}
          </Link>
        ))}
        <div className="mt-auto flex gap-2">
          <ThemeToggle />
          <LocaleToggle />
        </div>
      </aside>
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <a href="#app-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-white">
          Bỏ qua tới nội dung
        </a>
        <OfflineBanner />
        <UpdateBanner />
        <main id="app-main" className="p-4 md:p-8">{children}</main>
      </div>
      <BottomTabs />
    </div>
  );
}
