import { describe, expect, it } from "vitest";
import { mergeByUpdatedAt } from "@/lib/sync/adapter";
import { isSyncConfigured } from "@/lib/sync/supabase";
import { decodeShare, encodeShare } from "@/lib/share/share";
import { parseSuggestion } from "@/lib/ai/assist";

describe("sync merge", () => {
  const rec = (id: string, updatedAt: number) => ({ id, updatedAt });

  it("last-write-wins per record", () => {
    const { merged, toCloud, toLocal } = mergeByUpdatedAt(
      [rec("a", 2), rec("b", 1)],
      [rec("a", 1), rec("c", 5)],
    );
    expect(merged.find((r) => r.id === "a")?.updatedAt).toBe(2);
    expect(toCloud.map((r) => r.id).sort()).toEqual(["a", "b"]);
    expect(toLocal.map((r) => r.id)).toEqual(["c"]);
  });

  it("equal timestamps keep local without extra traffic", () => {
    const { toCloud, toLocal } = mergeByUpdatedAt([rec("a", 2)], [rec("a", 2)]);
    expect(toCloud).toHaveLength(0);
    expect(toLocal).toHaveLength(0);
  });

  it("unconfigured without env", () => {
    expect(isSyncConfigured()).toBe(false);
  });
});

describe("share link", () => {
  it("round-trips a small deck", () => {
    const code = encodeShare({
      v: 1,
      name: "Demo",
      emoji: "🎁",
      cards: [
        { word: "resilient", meaningVi: ["kiên cường"] },
        { word: "deadline", meaningVi: ["hạn chót"], exampleEn: "The deadline is Friday." },
      ],
    });
    expect(code.length).toBeLessThan(1500);
    const back = decodeShare(code);
    expect(back.name).toBe("Demo");
    expect(back.cards).toHaveLength(2);
  });

  it("rejects garbage", () => {
    expect(() => decodeShare("!!!not-a-share!!!")).toThrow();
  });
});

describe("ai suggestion parse", () => {
  it("parses JSON with noise around it", () => {
    const out = parseSuggestion(
      'Sure! {"meaningVi": ["kiên cường"], "exampleEn": "She is resilient.", "exampleVi": "Cô ấy kiên cường.", "mnemonic": "re + silient"} done',
    );
    expect(out?.meaningVi).toEqual(["kiên cường"]);
    expect(out?.exampleEn).toContain("resilient");
  });

  it("returns null on garbage", () => {
    expect(parseSuggestion("hello world")).toBeNull();
  });
});
