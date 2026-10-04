import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { RegisterSw } from "@/components/common/RegisterSw";
import { Toasts } from "@/components/common/Toasts";
import { AnalyticsTracker } from "@/components/common/Analytics";
import { AutoSync } from "@/components/settings/SyncPanel";
import { Suspense } from "react";
import { site } from "@/config/site";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnam.variable} ${notoSans.variable} min-h-dvh antialiased`}>
        <Providers>{children}</Providers>
        <Toasts />
        <Suspense>
          <AnalyticsTracker />
        </Suspense>
        <AutoSync />
        <RegisterSw />
      </body>
    </html>
  );
}
