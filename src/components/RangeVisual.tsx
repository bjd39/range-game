import type { Range, QuestionType } from "../types";
import { formatDateValue, formatDateWidth } from "../utils/dateFormat";

interface Props {
  fullRange: Range;
  currentRange: Range;
  answer?: number | null;
  showAnswer?: boolean;
  questionType?: QuestionType;
}

export default function RangeVisual({
  fullRange,
  currentRange,
  answer,
  showAnswer,
  questionType,
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

  const isDate = questionType === "date";
  const rangeWidth = currentRange.high - currentRange.low;
  const fmtVal = (v: number) => isDate ? formatDateValue(v, rangeWidth) : String(v);
  const fmtW = (w: number) => isDate ? formatDateWidth(w) : String(w);
  const fullWidth = fullRange.high - fullRange.low;
  const fmtFullVal = (v: number) => isDate ? formatDateValue(v, fullWidth) : String(v);

  return (
    <div className="range-visual">
      {showAnswer && answerPct != null && (
        <div className="range-answer-label-row">
          <div
            className={`range-answer-label ${answerInRange ? "in-range" : "out-of-range"}`}
            style={{ left: `${Math.max(0, Math.min(100, answerPct))}%` }}
          >
            {answer != null ? fmtVal(answer) : ""}
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
          {fmtVal(currentRange.low)}
        </div>
        <div
          className="range-bound range-bound-high"
          style={{ left: `${rightPct}%` }}
        >
          {fmtVal(currentRange.high)}
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
        <span>{fmtFullVal(fullRange.low)}</span>
        <span className="range-width">width: {fmtW(rangeWidth)}</span>
        <span>{fmtFullVal(fullRange.high)}</span>
      </div>
    </div>
  );
}
