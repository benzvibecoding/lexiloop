import { describe, expect, it } from "vitest";
import { site } from "@/config/site";

describe("site config", () => {
  it("has a single source of truth for the app name", () => {
    expect(site.name).toBe("LexiLoop");
    expect(site.description.length).toBeGreaterThan(10);
  });
});
