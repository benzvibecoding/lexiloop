import Link from "next/link";
import { ArrowRight, WifiOff, Repeat2, Layers, BarChart3 } from "lucide-react";
import { site } from "@/config/site";
import { DemoFlashcard } from "@/components/marketing/DemoFlashcard";
import { HowSrs } from "@/components/marketing/HowSrs";
import { ModesGrid } from "@/components/marketing/ModesGrid";
import { Faq, faqJsonLd } from "@/components/marketing/Faq";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleToggle } from "@/components/layout/LocaleToggle";
import { InstallButton } from "@/components/common/InstallButton";

export default function LandingPage() {
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: site.name,
    url: site.url,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
    description: site.description,
    inLanguage: ["vi", "en"],
  };
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-white">
        Bỏ qua tới nội dung
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(`${site.url}/`)) }} />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between p-4">
        <span className="flex items-center gap-2 font-extrabold text-lg">
          <span aria-hidden>🔁</span> {site.name}
        </span>
        <nav aria-label="Điều hướng" className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleToggle />
          <Link
            href="/dashboard"
            className="flex min-h-[44px] items-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-bold text-white"
          >
            Mở app học <ArrowRight size={16} aria-hidden />
          </Link>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl p-4 md:p-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              Flashcard + lặp lại ngắt quãng FSRS
            </p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Học từ vựng tiếng Anh, nhớ lâu mỗi ngày
            </h1>
            <p className="mt-4 text-lg text-stone-600 dark:text-stone-300">
              Flashcard + lặp lại ngắt quãng, chạy offline, không cần tài khoản. Mỗi ngày 10–30 phút là
              đủ.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="flex min-h-[48px] items-center rounded-2xl bg-orange-500 px-6 font-bold text-white shadow-card"
              >
                Học ngay — không cần đăng ký
              </Link>
              <InstallButton />
            </div>
            <ul className="mt-8 grid gap-3 text-sm">
              <li className="flex gap-2">
                <WifiOff size={18} aria-hidden className="shrink-0" /> Offline-first: mất mạng vẫn học
                được, dữ liệu nằm trên máy bạn.
              </li>
              <li className="flex gap-2">
                <Repeat2 size={18} aria-hidden className="shrink-0" /> Nhắc ôn đúng lúc theo trí nhớ
                của bạn, không học vẹt.
              </li>
              <li className="flex gap-2">
                <Layers size={18} aria-hidden className="shrink-0" /> 8 chế độ: flashcard, gõ từ, nghe,
                trắc nghiệm, ghép cặp…
              </li>
              <li className="flex gap-2">
                <BarChart3 size={18} aria-hidden className="shrink-0" /> Thống kê streak, heatmap, tỉ lệ
                nhớ thật.
              </li>
            </ul>
          </div>
          <div className="flex justify-center">
            <DemoFlashcard />
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <HowSrs />
          <section aria-labelledby="lib-h" className="rounded-3xl bg-stone-900 p-5 text-white shadow-soft dark:bg-amber-200 dark:text-stone-900">
            <h2 id="lib-h" className="font-bold">Bắt đầu với 408 thẻ có sẵn</h2>
            <p className="mt-1 text-sm opacity-80">12 deck tự biên: giao tiếp, du lịch, TOEIC, IELTS theo chủ đề, phrasal verbs, idioms… Một chạm là thêm vào bộ của bạn.</p>
            <Link href="/library" className="mt-3 inline-flex min-h-[44px] items-center rounded-2xl bg-white px-5 text-sm font-bold text-stone-900">
              Xem thư viện →
            </Link>
          </section>
        </div>

        <ModesGrid />
        <Faq />

        <section aria-labelledby="cta-h" className="mt-14 rounded-3xl bg-orange-500 p-8 text-center text-white shadow-card">
          <h2 id="cta-h" className="text-2xl font-extrabold md:text-3xl">Mỗi ngày 10 phút, vốn từ tăng đều</h2>
          <p className="mt-1 opacity-90">Miễn phí, không tài khoản, dùng được ngay cả khi mất mạng.</p>
          <Link href="/onboarding" className="mt-4 inline-flex min-h-[52px] items-center rounded-2xl bg-white px-8 font-bold text-orange-600">
            Bắt đầu 1 phút →
          </Link>
        </section>
      </main>

      <footer className="border-t border-stone-200 p-4 text-center text-sm text-stone-500 dark:border-stone-800">
        {site.name} — Làm với sự tử tế cho người học Việt Nam. ·{" "}
        <Link href="/about" className="underline">Giới thiệu</Link> ·{" "}
        <Link href="/privacy" className="underline">Quyền riêng tư</Link>
      </footer>
    </div>
  );
}
