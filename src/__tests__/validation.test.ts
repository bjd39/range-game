import { describe, it, expect } from "vitest";
import { validateNarrowing } from "../utils/validation";

describe("validateNarrowing", () => {
  const base = { low: 0, high: 100 };

  it("accepts a valid narrowing", () => {
    expect(validateNarrowing(base, { low: 10, high: 90 })).toBeNull();
  });

  it("accepts narrowing from one side only", () => {
    expect(validateNarrowing(base, { low: 0, high: 85 })).toBeNull();
    expect(validateNarrowing(base, { low: 15, high: 100 })).toBeNull();
  });

  it("rejects if low >= high", () => {
    const result = validateNarrowing(base, { low: 50, high: 50 });
    expect(result).not.toBeNull();
    expect(result!.message).toMatch(/low must be less than high/i);
  });

  it("rejects if new range extends beyond current", () => {
    expect(validateNarrowing(base, { low: -1, high: 90 })).not.toBeNull();
    expect(validateNarrowing(base, { low: 10, high: 101 })).not.toBeNull();
  });

  it("rejects if range is not narrowed at all", () => {
    const result = validateNarrowing(base, { low: 0, high: 100 });
    expect(result).not.toBeNull();
    expect(result!.message).toMatch(/must narrow/i);
  });

  it("rejects if narrowed by less than 10%", () => {
    // Width 95 is 95% of 100, only 5% narrower
    const result = validateNarrowing(base, { low: 3, high: 98 });
    expect(result).not.toBeNull();
    expect(result!.message).toMatch(/at least 10%/i);
  });

  it("accepts exactly 10% narrowing", () => {
    // Width 90 is exactly 90% of 100
    expect(validateNarrowing(base, { low: 5, high: 95 })).toBeNull();
  });

  it("works with non-zero base ranges", () => {
    const range = { low: 1000, high: 2000 };
    // Narrow by 10%: width 900 is 90% of 1000
    expect(validateNarrowing(range, { low: 1050, high: 1950 })).toBeNull();
    // Not enough narrowing
    expect(validateNarrowing(range, { low: 1001, high: 2000 })).not.toBeNull();
  });

  it("works with small ranges", () => {
    const range = { low: 0, high: 10 };
    expect(validateNarrowing(range, { low: 1, high: 9 })).toBeNull();
    expect(validateNarrowing(range, { low: 0, high: 10 })).not.toBeNull();
  });
});
