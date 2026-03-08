import { useState } from "react";
import type { Player, Narrowing, Range, Round } from "../types";
import QuestionInput from "./QuestionInput";
import NarrowingPhase from "./NarrowingPhase";
import RevealPhase from "./RevealPhase";

type Phase = "question" | "narrowing" | "reveal";

interface QuestionData {
  question: string;
  initialRange: Range;
  answer: number;
  source: string;
  aiNote?: string;
  initialHolderId: string | null;
}

interface Props {
  apiKey: string;
  players: Player[];
  timerDuration: number;
  previousQuestions: string[];
  onRoundComplete: (round: Round) => void;
  onSkipRound: () => void;
  onEndGame: () => void;
  roundNumber: number;
}

export default function GameRound({
  apiKey,
  players,
  timerDuration,
  previousQuestions,
  onRoundComplete,
  onSkipRound,
  onEndGame,
  roundNumber,
}: Props) {
  const [phase, setPhase] = useState<Phase>("question");
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [narrowings, setNarrowings] = useState<Narrowing[]>([]);
  const [finalRange, setFinalRange] = useState<Range | null>(null);
  const [holderId, setHolderId] = useState<string | null>(null);

  const handleQuestionReady = (
    question: string,
    initialRange: Range,
    answer: number,
    source: string,
    aiNote?: string,
    askedByPlayerId?: string,
  ) => {
    // For AI-generated questions (no askedByPlayerId), pick a random player
    const initialHolderId = askedByPlayerId
      ?? players[Math.floor(Math.random() * players.length)].id;

    setQuestionData({ question, initialRange, answer, source, aiNote, initialHolderId });
    setPhase("narrowing");
  };

  const handleNarrowingComplete = (
    narrs: Narrowing[],
    range: Range,
    holder: string | null
  ) => {
    setNarrowings(narrs);
    setFinalRange(range);
    setHolderId(holder);
    setPhase("reveal");
  };

  const handleNext = () => {
    if (!questionData || !finalRange) return;

    const inRange =
      questionData.answer >= finalRange.low &&
      questionData.answer <= finalRange.high;

    const round: Round = {
      id: crypto.randomUUID(),
      question: questionData.question,
      answer: questionData.answer,
      source: questionData.source,
      aiNote: questionData.aiNote,
      initialRange: questionData.initialRange,
      narrowings,
      finalRange,
      holderId,
      result: holderId == null ? "no_holder" : inRange ? "win" : "loss",
      timestamp: Date.now(),
    };

    onRoundComplete(round);
  };

  return (
    <div className="game-round">
      <div className="round-header">
        <span className="round-number">Round {roundNumber}</span>
        <div className="round-header-actions">
          <button className="btn-secondary btn-small" onClick={onSkipRound}>
            Skip Question
          </button>
          <button className="btn-secondary btn-small" onClick={onEndGame}>
            End Game
          </button>
        </div>
      </div>

      {phase === "question" && (
        <QuestionInput apiKey={apiKey} players={players} previousQuestions={previousQuestions} onQuestionReady={handleQuestionReady} />
      )}

      {phase === "narrowing" && questionData && (
        <NarrowingPhase
          question={questionData.question}
          initialRange={questionData.initialRange}
          initialHolderId={questionData.initialHolderId}
          players={players}
          timerDuration={timerDuration}
          onComplete={handleNarrowingComplete}
        />
      )}

      {phase === "reveal" && questionData && finalRange && (
        <RevealPhase
          question={questionData.question}
          answer={questionData.answer}
          source={questionData.source}
          aiNote={questionData.aiNote}
          initialRange={questionData.initialRange}
          finalRange={finalRange}
          holderId={holderId}
          players={players}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
