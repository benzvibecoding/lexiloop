import { describe, expect, it } from "vitest";
import { cardsToCsv, sanitizeForCsvCell } from "@/lib/backup/backup";

describe("csv safety", () => {
  it("escapes formula cells", () => {
    expect(sanitizeForCsvCell("=cmd|'/c calc'!A0")).toBe("'=cmd|'/c calc'!A0");
    expect(sanitizeForCsvCell("+123")).toBe("'+123");
    expect(sanitizeForCsvCell("hello")).toBe("hello");
  });

  it("exports word,meaning header", () => {
    const csv = cardsToCsv([{ word: "resilient", meaningVi: ["kiên cường"] }]);
    expect(csv.split("\n")[0]).toBe("word,meaningVi");
  });
});
