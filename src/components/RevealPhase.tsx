import { useState, useEffect } from "react";
import type { Player, Range } from "../types";
import RangeVisual from "./RangeVisual";

interface Props {
  question: string;
  answer: number;
  source: string;
  aiNote?: string;
  initialRange: Range;
  finalRange: Range;
  holderId: string | null;
  players: Player[];
  onNext: () => void;
}

export default function RevealPhase({
  question,
  answer,
  source,
  aiNote,
  initialRange,
  finalRange,
  holderId,
  players,
  onNext,
}: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const inRange = answer >= finalRange.low && answer <= finalRange.high;
  const holder = holderId ? players.find((p) => p.id === holderId) : null;

  let resultText: string;
  let resultClass: string;
  if (!holder) {
    resultText = "No one held the range — no points scored.";
    resultClass = "result-neutral";
  } else if (inRange) {
    resultText = `${holder.name} gets +1! The answer is in the range.`;
    resultClass = "result-win";
  } else {
    resultText = `${holder.name} gets -1. The answer is outside the range.`;
    resultClass = "result-loss";
  }

  return (
    <div className="reveal-phase">
      <h2 className="question-display">{question}</h2>

      <RangeVisual
        fullRange={initialRange}
        currentRange={finalRange}
        answer={answer}
        showAnswer={revealed}
      />

      <div className={`answer-reveal ${revealed ? "visible" : ""}`}>
        <div className="answer-number">{answer}</div>
        <div className="answer-source">Source: {source}</div>
        {aiNote && <div className="ai-note">{aiNote}</div>}
      </div>

      {revealed && (
        <div className={`result-banner ${resultClass}`}>
          <p>{resultText}</p>
        </div>
      )}

      {revealed && (
        <button className="btn-primary" onClick={onNext}>
          Next Round
        </button>
      )}
    </div>
  );
}
