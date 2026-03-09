import { useState } from "react";
import type { Player, Narrowing, Range, Round, QuestionType } from "../types";
import QuestionInput from "./QuestionInput";
import NarrowingPhase from "./NarrowingPhase";
import RevealPhase from "./RevealPhase";
import ResolvePhase from "./ResolvePhase";

type Phase = "question" | "narrowing" | "resolve" | "reveal";

interface QuestionData {
  question: string;
  initialRange: Range;
  answer: number | null;
  source: string;
  aiNote?: string;
  initialHolderId: string | null;
  questionType?: QuestionType;
}

interface Props {
  apiKey: string | null;
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
  const [finalRange, setFinalRange] = useState<Range | null>(null);
  const [holderId, setHolderId] = useState<string | null>(null);
  const [narrowings, setNarrowings] = useState<Narrowing[]>([]);
  const [roundSaved, setRoundSaved] = useState(false);

  const handleQuestionReady = (
    question: string,
    initialRange: Range,
    answer: number | null,
    source: string,
    aiNote?: string,
    askedByPlayerId?: string,
    questionType?: QuestionType,
  ) => {
    const initialHolderId = askedByPlayerId
      ?? players[Math.floor(Math.random() * players.length)].id;

    setQuestionData({ question, initialRange, answer, source, aiNote, initialHolderId, questionType });
    setPhase("narrowing");
  };

  const buildRound = (
    qd: QuestionData,
    narrs: Narrowing[],
    fRange: Range,
    holder: string | null,
  ): Round => {
    const answer = qd.answer ?? 0;
    const inRange = answer >= fRange.low && answer <= fRange.high;
    return {
      id: crypto.randomUUID(),
      question: qd.question,
      answer,
      source: qd.source,
      aiNote: qd.aiNote,
      questionType: qd.questionType,
      initialRange: qd.initialRange,
      narrowings: narrs,
      finalRange: fRange,
      holderId: holder,
      result: holder == null ? "no_holder" : inRange ? "win" : "loss",
      timestamp: Date.now(),
    };
  };

  const handleNarrowingComplete = (
    narrs: Narrowing[],
    range: Range,
    holder: string | null
  ) => {
    setFinalRange(range);
    setHolderId(holder);
    setNarrowings(narrs);

    if (questionData?.answer == null) {
      // No answer yet — need user to resolve
      setPhase("resolve");
    } else {
      setPhase("reveal");
      // Persist immediately so data isn't lost if user clicks "End Game"
      const round = buildRound(questionData, narrs, range, holder);
      onRoundComplete(round);
      setRoundSaved(true);
    }
  };

  const handleResolve = (answer: number, source: string) => {
    if (!questionData || !finalRange) return;
    const resolved = { ...questionData, answer, source };
    setQuestionData(resolved);
    setPhase("reveal");
    const round = buildRound(resolved, narrowings, finalRange, holderId);
    onRoundComplete(round);
    setRoundSaved(true);
  };

  const handleNext = () => {
    // Round was already saved when entering reveal phase.
    // This just advances to the next round by triggering a re-key in the parent.
    if (!roundSaved && questionData && finalRange) {
      // Fallback: save if somehow it wasn't saved yet
      const round = buildRound(questionData, [], finalRange, holderId);
      onRoundComplete(round);
    }
    onSkipRound();
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
          questionType={questionData.questionType}
          onComplete={handleNarrowingComplete}
        />
      )}

      {phase === "resolve" && questionData && finalRange && (
        <ResolvePhase
          question={questionData.question}
          finalRange={finalRange}
          questionType={questionData.questionType}
          onResolve={handleResolve}
        />
      )}

      {phase === "reveal" && questionData && questionData.answer != null && finalRange && (
        <RevealPhase
          question={questionData.question}
          answer={questionData.answer}
          source={questionData.source}
          aiNote={questionData.aiNote}
          initialRange={questionData.initialRange}
          finalRange={finalRange}
          holderId={holderId}
          players={players}
          questionType={questionData.questionType}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
