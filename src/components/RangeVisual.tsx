import type { Range } from "../types";

interface Props {
  fullRange: Range;
  currentRange: Range;
  answer?: number | null;
  showAnswer?: boolean;
}

export default function RangeVisual({
  fullRange,
  currentRange,
  answer,
  showAnswer,
}: Props) {
  const total = fullRange.high - fullRange.low;
  if (total <= 0) return null;

  const leftPct = ((currentRange.low - fullRange.low) / total) * 100;
  const widthPct =
    ((currentRange.high - currentRange.low) / total) * 100;
  const rightPct = leftPct + widthPct;

  const answerPct =
    answer != null ? ((answer - fullRange.low) / total) * 100 : null;
  const answerInRange =
    answer != null && answer >= currentRange.low && answer <= currentRange.high;

  return (
    <div className="range-visual">
      {showAnswer && answerPct != null && (
        <div className="range-answer-label-row">
          <div
            className={`range-answer-label ${answerInRange ? "in-range" : "out-of-range"}`}
            style={{ left: `${Math.max(0, Math.min(100, answerPct))}%` }}
          >
            {answer}
          </div>
        </div>
      )}
      <div className="range-track">
        <div
          className="range-fill"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        <div
          className="range-bound range-bound-low"
          style={{ left: `${leftPct}%` }}
        >
          {currentRange.low}
        </div>
        <div
          className="range-bound range-bound-high"
          style={{ left: `${rightPct}%` }}
        >
          {currentRange.high}
        </div>
        {showAnswer && answerPct != null && (
          <div
            className={`range-answer-marker ${answerInRange ? "in-range" : "out-of-range"}`}
            style={{ left: `${Math.max(0, Math.min(100, answerPct))}%` }}
          >
            <div className="marker-line" />
          </div>
        )}
      </div>
      <div className="range-labels">
        <span>{fullRange.low}</span>
        <span className="range-width">width: {currentRange.high - currentRange.low}</span>
        <span>{fullRange.high}</span>
      </div>
    </div>
  );
}
