import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("admin", () => {
  it("schema has admins + analytics tables with admin-only read", () => {
    const sql = readFileSync(join(root, "supabase/schema.sql"), "utf8");
    for (const needle of [
      "create table if not exists admins",
      "create table if not exists analytics_events",
      '"track insert"',
      '"admin read events"',
      '"admin read logs"',
      "exists (select 1 from admins where admins.user_id = auth.uid())",
    ]) {
      expect(sql, needle).toContain(needle);
    }
  });

  it("sidebar hides admin link for non-admins by default", () => {
    const shell = readFileSync(join(root, "src/components/layout/AppShell.tsx"), "utf8");
    expect(shell).toContain('href: "/admin"');
    expect(shell).toContain("useIsAdmin");
    // Không render sẵn cho mọi user
    expect(shell).toContain("isAdmin ?");
  });

  it("robots keeps admin + leaderboard out of search", () => {
    const robots = readFileSync(join(root, "src/app/robots.ts"), "utf8");
    expect(robots).toContain("/admin");
    expect(robots).toContain("/leaderboard");
  });

  it("admin page file exists", () => {
    expect(existsSync(join(root, "src/app/admin/page.tsx"))).toBe(true);
  });
});
