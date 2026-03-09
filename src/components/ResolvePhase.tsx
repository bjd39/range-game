import { useState } from "react";
import type { Range, QuestionType } from "../types";
import { formatDateValue } from "../utils/dateFormat";

interface Props {
  question: string;
  finalRange: Range;
  questionType?: QuestionType;
  onResolve: (answer: number, source: string) => void;
}

export default function ResolvePhase({ question, finalRange, questionType, onResolve }: Props) {
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState("");

  const handleSubmit = () => {
    const num = Number(answer);
    if (isNaN(num)) return;
    onResolve(num, source.trim() || "manual");
  };

  const rangeText = questionType === "date"
    ? `${formatDateValue(finalRange.low, finalRange.high - finalRange.low)} – ${formatDateValue(finalRange.high, finalRange.high - finalRange.low)}`
    : `${finalRange.low} – ${finalRange.high}`;

  return (
    <div className="resolve-phase">
      <h2 className="question-display">{question}</h2>

      <div className="resolve-range-info">
        Final range: <strong>{rangeText}</strong>
      </div>

      <div className="resolve-form">
        <label className="resolve-label">What's the answer?</label>
        <input
          type="number"
          placeholder={questionType === "date" ? "e.g. 1492" : "Enter the answer"}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && answer) handleSubmit();
          }}
          autoFocus
        />
        <input
          type="text"
          placeholder="Source (optional), e.g. Wikipedia"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && answer) handleSubmit();
          }}
        />
        <button
          className="btn-primary"
          disabled={!answer || isNaN(Number(answer))}
          onClick={handleSubmit}
        >
          Reveal Answer
        </button>
      </div>
    </div>
  );
}
