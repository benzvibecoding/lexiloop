import { describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n/dictionaries";

describe("i18n dictionaries", () => {
  it("vi and en share the same keys", () => {
    expect(Object.keys(dictionaries.en).sort()).toEqual(Object.keys(dictionaries.vi).sort());
  });

  it("renders Vietnamese IPA glyphs", () => {
    expect(dictionaries.vi.demo_ipa).toContain("/");
  });
});
