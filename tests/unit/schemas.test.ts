import { describe, expect, it } from "vitest";
import { settingsSchema, deckSchema } from "@/lib/db/schemas";
import { defaultSettings } from "@/lib/db/client";

describe("schemas", () => {
  it("default settings are valid", () => {
    expect(() => settingsSchema.parse(defaultSettings())).not.toThrow();
  });

  it("rejects bad retention", () => {
    const s = defaultSettings();
    expect(() => settingsSchema.parse({ ...s, desiredRetention: 0.5 })).toThrow();
  });

  it("rejects empty deck name", () => {
    expect(() =>
      deckSchema.parse({
        id: "x",
        name: "",
        emoji: "📚",
        color: "coral",
        tags: [],
        archived: false,
        createdAt: 1,
        updatedAt: 1,
      }),
    ).toThrow();
  });
});
