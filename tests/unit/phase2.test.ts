import { describe, expect, it } from "vitest";
import { parseDelimited, parseQuizletPasted, parseJsonCards, findDuplicates } from "@/lib/import-export/parse";
import { parseFreeDict } from "@/lib/dictionary/freeDict";

describe("import parse", () => {
  it("parses CSV word,meaning", () => {
    const rows = parseDelimited("resilient,kiên cường\ndeadline,hạn chót", { word: 0, meaningVi: 1 });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ word: "resilient", meaningVi: "kiên cường" });
  });

  it("parses TSV", () => {
    const rows = parseDelimited("resilient\tkiên cường", { word: 0, meaningVi: 1 });
    expect(rows[0]?.word).toBe("resilient");
  });

  it("parses quizlet paste", () => {
    const rows = parseQuizletPasted("resilient\tkiên cường\ndeadline - hạn chót");
    expect(rows).toHaveLength(2);
  });

  it("parses JSON", () => {
    const rows = parseJsonCards([{ word: "hi", meaningVi: "xin chào" }, { word: "", meaningVi: "x" }]);
    expect(rows).toHaveLength(1);
  });

  it("detects duplicates incl. inside file", () => {
    const rows = [{ word: "Hi", meaningVi: "chào" }, { word: "hi", meaningVi: "chào 2" }];
    const d = findDuplicates(rows, ["hello"]);
    expect(d).toHaveLength(1);
  });
});

describe("freeDict parse", () => {
  it("parses minimal entry", () => {
    const e = parseFreeDict("hi", [
      {
        word: "hi",
        phonetic: "/haɪ/",
        phonetics: [{ text: "/haɪ/", audio: "https://x.mp3" }],
        meanings: [{ partOfSpeech: "exclamation", definitions: [{ definition: "greeting", example: "Hi there!" }] }],
      },
    ]);
    expect(e?.ipaUs).toBe("/haɪ/");
    expect(e?.pos).toEqual(["exclamation"]);
  });

  it("returns null on 404 shape", () => {
    expect(parseFreeDict("zzz", { title: "No Definitions Found" })).toBeNull();
  });
});
