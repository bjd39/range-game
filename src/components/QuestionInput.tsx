import { useState } from "react";
import type { AIValidationResult, AIGeneratedQuestion, Player, Range } from "../types";
import { validateQuestion, generateQuestion } from "../utils/gemini";

interface Props {
  apiKey: string;
  players: Player[];
  previousQuestions: string[];
  onQuestionReady: (
    question: string,
    initialRange: Range,
    answer: number,
    source: string,
    aiNote?: string,
    askedByPlayerId?: string
  ) => void;
}

type Tab = "ask" | "generate";

export default function QuestionInput({ apiKey, players, previousQuestions, onQuestionReady }: Props) {
  const [tab, setTab] = useState<Tab>("generate");
  const [question, setQuestion] = useState("");
  const [rangeLow, setRangeLow] = useState("");
  const [rangeHigh, setRangeHigh] = useState("");
  const [askedBy, setAskedBy] = useState(players[0]?.id || "");
  const [topicHint, setTopicHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<AIValidationResult | null>(null);
  const [generated, setGenerated] = useState<AIGeneratedQuestion | null>(null);
  const [genRangeLow, setGenRangeLow] = useState("");
  const [genRangeHigh, setGenRangeHigh] = useState("");

  const handleManualSubmit = async () => {
    if (!question.trim() || !rangeLow || !rangeHigh) return;
    setLoading(true);
    setError(null);
    setValidation(null);
    try {
      const result = await validateQuestion(apiKey, question.trim());
      if (result.answerable) {
        setValidation(result);
      } else {
        setError(result.note || "This question can't be resolved to a single number.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "API error");
    } finally {
      setLoading(false);
    }
  };

  const confirmManual = () => {
    if (!validation) return;
    onQuestionReady(
      question.trim(),
      { low: Number(rangeLow), high: Number(rangeHigh) },
      validation.answer,
      validation.source,
      validation.note,
      askedBy
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setGenerated(null);
    try {
      const result = await generateQuestion(apiKey, topicHint.trim() || undefined, previousQuestions);
      setGenerated(result);
      setGenRangeLow("");
      setGenRangeHigh("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "API error");
    } finally {
      setLoading(false);
    }
  };

  const confirmGenerated = () => {
    if (!generated || !genRangeLow || !genRangeHigh) return;
    onQuestionReady(
      generated.question,
      { low: Number(genRangeLow), high: Number(genRangeHigh) },
      generated.answer,
      generated.source
    );
  };

  return (
    <div className="question-input">
      <div className="tabs">
        <button
          className={`tab ${tab === "generate" ? "active" : ""}`}
          onClick={() => { setTab("generate"); setError(null); setValidation(null); }}
        >
          Generate a question
        </button>
        <button
          className={`tab ${tab === "ask" ? "active" : ""}`}
          onClick={() => { setTab("ask"); setError(null); setValidation(null); }}
        >
          Ask a question
        </button>
      </div>

      {tab === "ask" && (
        <div className="tab-content">
          <input
            type="text"
            placeholder="e.g. When was Richard III coronated?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
          <div className="range-inputs">
            <input
              type="number"
              placeholder="Range low"
              value={rangeLow}
              onChange={(e) => setRangeLow(e.target.value)}
              disabled={loading}
            />
            <span className="range-separator">to</span>
            <input
              type="number"
              placeholder="Range high"
              value={rangeHigh}
              onChange={(e) => setRangeHigh(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="asked-by-row">
            <label>Asked by:</label>
            <select value={askedBy} onChange={(e) => setAskedBy(e.target.value)} disabled={loading}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {validation && (
            <div className="validation-success">
              <p>✓ Answer found (source: {validation.source})</p>
              {validation.note && <p className="ai-note">{validation.note}</p>}
              <button className="btn-primary" onClick={confirmManual}>
                Start Round
              </button>
            </div>
          )}
          {!validation && (
            <button
              className="btn-primary"
              disabled={loading || !question.trim() || !rangeLow || !rangeHigh}
              onClick={handleManualSubmit}
            >
              {loading ? "Checking…" : "Submit Question"}
            </button>
          )}
        </div>
      )}

      {tab === "generate" && (
        <div className="tab-content">
          {!generated ? (
            <>
              <input
                type="text"
                placeholder="Topic hint (optional), e.g. 'space exploration'"
                value={topicHint}
                onChange={(e) => setTopicHint(e.target.value)}
                disabled={loading}
              />
              <button
                className="btn-primary"
                disabled={loading}
                onClick={handleGenerate}
              >
                {loading ? "Generating…" : "Generate Question"}
              </button>
            </>
          ) : (
            <>
              <div className="generated-question">
                <p className="generated-question-text">{generated.question}</p>
              </div>
              <label className="range-label">Set the initial range:</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Range low"
                  value={genRangeLow}
                  onChange={(e) => setGenRangeLow(e.target.value)}
                />
                <span className="range-separator">to</span>
                <input
                  type="number"
                  placeholder="Range high"
                  value={genRangeHigh}
                  onChange={(e) => setGenRangeHigh(e.target.value)}
                />
              </div>
              <div className="generated-actions">
                <button
                  className="btn-primary"
                  disabled={!genRangeLow || !genRangeHigh}
                  onClick={confirmGenerated}
                >
                  Start Round
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => { setGenerated(null); setGenRangeLow(""); setGenRangeHigh(""); }}
                >
                  Re-generate
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
