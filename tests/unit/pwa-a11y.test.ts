import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}

function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const root = process.cwd();

describe("a11y: color contrast (WCAG AA)", () => {
  it("body text pairs pass AA", () => {
    expect(contrast("#1c1917", "#FFF9F0")).toBeGreaterThanOrEqual(7); // ink on cream
    expect(contrast("#ffffff", "#1c1917")).toBeGreaterThanOrEqual(7); // white on stone-900
    expect(contrast("#44403c", "#FFF9F0")).toBeGreaterThanOrEqual(4.5); // ink-700 on cream
  });

  it("grade buttons use icon + label (never color alone)", () => {
    const src = readFileSync(join(root, "src/components/study/GradeButtons.tsx"), "utf8");
    expect(src).toContain("aria-label");
    expect(src).toContain("icon");
    expect(src).toContain("{label}");
  });

  it("focus-visible style is defined globally", () => {
    const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
    expect(css).toContain(":focus-visible");
  });

  it("html lang is vi and skip links exist", async () => {
    const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
    expect(layout).toContain('lang="vi"');
    const landing = readFileSync(join(root, "src/app/page.tsx"), "utf8");
    expect(landing).toContain('href="#main"');
    const shell = readFileSync(join(root, "src/components/layout/AppShell.tsx"), "utf8");
    expect(shell).toContain('href="#app-main"');
  });
});

describe("seo + pwa", () => {
  it("ships PNG icons 192/512 + maskable", () => {
    for (const f of ["icon-192.png", "icon-512.png", "maskable-512.png", "icon.svg"]) {
      expect(existsSync(join(root, "public/icons", f)), f).toBe(true);
    }
  });

  it("service worker precaches app shell + offline fallback + SWR for dictionary", () => {
    const sw = readFileSync(join(root, "public/sw.js"), "utf8");
    for (const route of ["/dashboard", "/review", "/study", "/offline"]) {
      expect(sw).toContain(`"${route}"`);
    }
    expect(sw).toContain("api.dictionaryapi.dev");
  });

  it("landing has JSON-LD WebApplication + FAQ", () => {
    const landing = readFileSync(join(root, "src/app/page.tsx"), "utf8");
    expect(landing).toContain("WebApplication");
    const faq = readFileSync(join(root, "src/components/marketing/Faq.tsx"), "utf8");
    expect(faq).toContain("FAQPage");
  });

  it("robots + sitemap cover public pages", () => {
    const robots = readFileSync(join(root, "src/app/robots.ts"), "utf8");
    expect(robots).toContain("/dashboard");
    const sitemap = readFileSync(join(root, "src/app/sitemap.ts"), "utf8");
    for (const p of ["/about", "/privacy", "/onboarding", "/placement"]) {
      expect(sitemap).toContain(p);
    }
  });
});
