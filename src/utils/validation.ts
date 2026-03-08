import type { Range } from "../types";

export interface NarrowingError {
  message: string;
}

export function validateNarrowing(
  current: Range,
  proposed: Range
): NarrowingError | null {
  if (proposed.low >= proposed.high) {
    return { message: "Low must be less than high." };
  }

  if (proposed.low < current.low || proposed.high > current.high) {
    return { message: "New range must be within the current range." };
  }

  if (proposed.low <= current.low && proposed.high >= current.high) {
    return { message: "You must narrow the range." };
  }

  const currentWidth = current.high - current.low;
  const proposedWidth = proposed.high - proposed.low;

  if (proposedWidth > currentWidth * 0.9) {
    return {
      message: `Must narrow by at least 10%. Maximum width: ${Math.floor(currentWidth * 0.9)}.`,
    };
  }

  return null;
}
