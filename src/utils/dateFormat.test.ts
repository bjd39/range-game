import { describe, it, expect } from "vitest";
import {
  decimalYearToDate,
  dateToDecimalYear,
  getDatePrecision,
  formatDateValue,
  formatDateWidth,
  datePartsToDecimalYear,
} from "./dateFormat";

describe("decimalYearToDate", () => {
  it("converts start of year", () => {
    const d = decimalYearToDate(2000.0);
    expect(d.getFullYear()).toBe(2000);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("converts mid-year approximately to July", () => {
    const d = decimalYearToDate(2000.5);
    expect(d.getFullYear()).toBe(2000);
    // ~July (month 6)
    expect(d.getMonth()).toBeGreaterThanOrEqual(5);
    expect(d.getMonth()).toBeLessThanOrEqual(6);
  });

  it("converts a specific date", () => {
    // July 6, 1483 ≈ 1483.51
    const d = decimalYearToDate(1483.51);
    expect(d.getFullYear()).toBe(1483);
    expect(d.getMonth()).toBe(6); // July
  });
});

describe("dateToDecimalYear", () => {
  it("converts Jan 1 to .0", () => {
    const dy = dateToDecimalYear(new Date(2000, 0, 1));
    expect(dy).toBeCloseTo(2000.0, 2);
  });

  it("converts mid-year to ~.5", () => {
    const dy = dateToDecimalYear(new Date(2000, 6, 2));
    expect(dy).toBeCloseTo(2000.5, 1);
  });

  it("round-trips through decimalYearToDate", () => {
    const original = new Date(1990, 3, 15);
    const dy = dateToDecimalYear(original);
    const result = decimalYearToDate(dy);
    expect(result.getFullYear()).toBe(1990);
    expect(result.getMonth()).toBe(3);
    // Allow ±1 day due to floating point
    expect(Math.abs(result.getDate() - 15)).toBeLessThanOrEqual(1);
  });
});

describe("getDatePrecision", () => {
  it("returns year for wide ranges", () => {
    expect(getDatePrecision(100)).toBe("year");
    expect(getDatePrecision(10)).toBe("year");
    expect(getDatePrecision(8.33)).toBe("year");
  });

  it("returns month for medium ranges", () => {
    expect(getDatePrecision(5)).toBe("month");
    expect(getDatePrecision(2)).toBe("month");
    expect(getDatePrecision(1.92)).toBe("month");
  });

  it("returns day for narrow ranges", () => {
    expect(getDatePrecision(1)).toBe("day");
    expect(getDatePrecision(0.5)).toBe("day");
    expect(getDatePrecision(0.1)).toBe("day");
  });
});

describe("formatDateValue", () => {
  it("shows year only for wide ranges", () => {
    expect(formatDateValue(1483.5, 100)).toBe("1484");
  });

  it("shows month + year for medium ranges", () => {
    const result = formatDateValue(1483.51, 5);
    expect(result).toMatch(/Jul 1483/);
  });

  it("shows day + month + year for narrow ranges", () => {
    const result = formatDateValue(1483.51, 0.5);
    expect(result).toMatch(/\d+ Jul 1483/);
  });
});

describe("formatDateWidth", () => {
  it("formats years", () => {
    expect(formatDateWidth(10)).toBe("10 years");
    expect(formatDateWidth(1)).toBe("1 year");
  });

  it("formats months", () => {
    expect(formatDateWidth(0.5)).toBe("6 months");
    expect(formatDateWidth(1 / 12)).toBe("1 month");
  });

  it("formats days", () => {
    expect(formatDateWidth(1 / 365.25)).toBe("1 day");
    expect(formatDateWidth(10 / 365.25)).toBe("10 days");
  });
});

describe("datePartsToDecimalYear", () => {
  it("converts year only", () => {
    const dy = datePartsToDecimalYear(2000);
    expect(dy).toBeCloseTo(2000.0, 2);
  });

  it("converts year + month", () => {
    const dy = datePartsToDecimalYear(2000, 6); // July
    expect(dy).toBeGreaterThan(2000.4);
    expect(dy).toBeLessThan(2000.6);
  });

  it("converts year + month + day", () => {
    const dy = datePartsToDecimalYear(2000, 0, 15);
    expect(dy).toBeGreaterThan(2000.0);
    expect(dy).toBeLessThan(2000.05);
  });
});
