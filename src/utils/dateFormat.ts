const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function decimalYearToDate(dy: number): Date {
  const year = Math.floor(dy);
  const fraction = dy - year;
  const totalDays = daysInYear(year);
  const dayOfYear = fraction * totalDays;

  // Build up month/day from day-of-year
  const months = [...DAYS_IN_MONTH];
  if (isLeapYear(year)) months[1] = 29;

  let remaining = dayOfYear;
  let month = 0;
  for (let i = 0; i < 12; i++) {
    if (remaining < months[i]) {
      month = i;
      break;
    }
    remaining -= months[i];
    if (i === 11) month = 11;
  }

  const day = Math.floor(remaining) + 1;
  return new Date(year, month, day);
}

export function dateToDecimalYear(d: Date): number {
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const diffMs = d.getTime() - startOfYear.getTime();
  const dayOfYear = diffMs / (1000 * 60 * 60 * 24);
  return year + dayOfYear / daysInYear(year);
}

export type DatePrecision = "year" | "month" | "day";

export function getDatePrecision(rangeWidth: number): DatePrecision {
  if (rangeWidth >= 8.33) return "year";
  if (rangeWidth >= 1.92) return "month";
  return "day";
}

export function formatDateValue(value: number, rangeWidth: number): string {
  const precision = getDatePrecision(rangeWidth);
  if (precision === "year") {
    return String(Math.round(value));
  }
  const d = decimalYearToDate(value);
  if (precision === "month") {
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateWidth(width: number): string {
  if (width >= 1) {
    const years = Math.round(width);
    return `${years} year${years !== 1 ? "s" : ""}`;
  }
  const months = Math.round(width * 12);
  if (months >= 1) {
    return `${months} month${months !== 1 ? "s" : ""}`;
  }
  const days = Math.round(width * 365.25);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

export function datePartsToDecimalYear(
  year: number,
  month?: number,
  day?: number,
): number {
  const d = new Date(year, month ?? 0, day ?? 1);
  return dateToDecimalYear(d);
}
