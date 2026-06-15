import { describe, expect, it } from "vitest";

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

describe("availability overlap rules", () => {
  it("detects overlapping blocks", () => {
    expect(
      overlaps(
        new Date("2026-06-15T13:00:00Z"),
        new Date("2026-06-15T15:00:00Z"),
        new Date("2026-06-15T14:00:00Z"),
        new Date("2026-06-15T16:00:00Z")
      )
    ).toBe(true);
  });

  it("allows adjacent blocks", () => {
    expect(
      overlaps(
        new Date("2026-06-15T13:00:00Z"),
        new Date("2026-06-15T15:00:00Z"),
        new Date("2026-06-15T15:00:00Z"),
        new Date("2026-06-15T16:00:00Z")
      )
    ).toBe(false);
  });
});
