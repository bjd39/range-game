export interface Player {
  id: string;
  name: string;
}

export interface Narrowing {
  playerId: string;
  low: number;
  high: number;
  timestamp: number;
}

export interface Range {
  low: number;
  high: number;
}

export type QuestionType = "number" | "date";

export interface Round {
  id: string;
  question: string;
  answer: number;
  source: string;
  aiNote?: string;
  questionType?: QuestionType;
  initialRange: Range;
  narrowings: Narrowing[];
  finalRange: Range;
  holderId: string | null;
  result: "win" | "loss" | "no_holder";
  timestamp: number;
}

export interface GameSession {
  id: string;
  date: string;
  playerIds: string[];
  rounds: Round[];
}

export interface GameStore {
  players: Player[];
  sessions: GameSession[];
}

export interface AIValidationResult {
  answerable: boolean;
  answer: number;
  source: string;
  note?: string;
  type?: "date" | "number";
}

export interface AIGeneratedQuestion {
  question: string;
  answer: number;
  source: string;
  initial_range_low: number;
  initial_range_high: number;
  type?: "date" | "number";
}
