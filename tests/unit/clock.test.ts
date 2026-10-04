import { describe, expect, it } from "vitest";
import { dayKey, dayStartMs, addDaysKey, diffDaysKey, fixedClock } from "@/lib/clock/clock";

describe("clock", () => {
  it("dayKey respects rollover 04:00", () => {
    // 2026-10-04 02:30 -> still 10-03 study day
    const early = new Date(2026, 9, 4, 2, 30, 0).getTime();
    expect(dayKey(early, 4)).toBe("2026-10-03");
    const late = new Date(2026, 9, 4, 5, 0, 0).getTime();
    expect(dayKey(late, 4)).toBe("2026-10-04");
  });

  it("dayStartMs is stable inside a study day", () => {
    const a = new Date(2026, 9, 4, 5, 0, 0).getTime();
    const b = new Date(2026, 9, 5, 3, 59, 0).getTime();
    expect(dayStartMs(a, 4)).toBe(dayStartMs(b, 4));
  });

  it("add/diff days helpers", () => {
    expect(addDaysKey("2026-10-04", 1)).toBe("2026-10-05");
    expect(diffDaysKey("2026-10-05", "2026-10-04")).toBe(1);
  });

  it("fixedClock injects time", () => {
    const c = fixedClock(123);
    expect(c.now()).toBe(123);
  });
});
