import { useState, useEffect, useCallback } from "react";
import type { Player, Narrowing, Range } from "../types";
import { validateNarrowing } from "../utils/validation";
import RangeVisual from "./RangeVisual";

interface Props {
  question: string;
  initialRange: Range;
  initialHolderId?: string | null;
  players: Player[];
  timerDuration: number;
  onComplete: (narrowings: Narrowing[], finalRange: Range, holderId: string | null) => void;
}

export default function NarrowingPhase({
  question,
  initialRange,
  initialHolderId,
  players,
  timerDuration,
  onComplete,
}: Props) {
  const [currentRange, setCurrentRange] = useState<Range>(initialRange);
  const [narrowings, setNarrowings] = useState<Narrowing[]>([]);
  const [holderId, setHolderId] = useState<string | null>(initialHolderId ?? null);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [selectedPlayer, setSelectedPlayer] = useState(players[0].id);
  const [inputLow, setInputLow] = useState("");
  const [inputHigh, setInputHigh] = useState("");
  const [error, setError] = useState<string | null>(null);

  const finish = useCallback(() => {
    onComplete(narrowings, currentRange, holderId);
  }, [narrowings, currentRange, holderId, onComplete]);

  const noLimit = timerDuration === 0;

  useEffect(() => {
    if (noLimit) return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, finish, noLimit]);

  const handleUndo = () => {
    if (narrowings.length === 0) return;
    const prev = narrowings.slice(0, -1);
    setNarrowings(prev);
    if (prev.length > 0) {
      const last = prev[prev.length - 1];
      setCurrentRange({ low: last.low, high: last.high });
      setHolderId(last.playerId);
    } else {
      setCurrentRange(initialRange);
      setHolderId(initialHolderId ?? null);
    }
    setTimeLeft(timerDuration);
    setInputLow("");
    setInputHigh("");
    setError(null);
  };

  const applyNarrowing = (playerId: string, proposed: Range) => {
    const err = validateNarrowing(currentRange, proposed);
    if (err) {
      setError(err.message);
      return;
    }

    const narrowing: Narrowing = {
      playerId,
      low: proposed.low,
      high: proposed.high,
      timestamp: Date.now(),
    };

    setNarrowings((prev) => [...prev, narrowing]);
    setCurrentRange(proposed);
    setHolderId(playerId);
    setTimeLeft(timerDuration);
    setInputLow("");
    setInputHigh("");
    setSelectedPlayer(playerId);
    setError(null);
  };

  const handleNarrow = () => {
    const proposed: Range = {
      low: inputLow !== "" ? Number(inputLow) : currentRange.low,
      high: inputHigh !== "" ? Number(inputHigh) : currentRange.high,
    };
    applyNarrowing(selectedPlayer, proposed);
  };

  const width = currentRange.high - currentRange.low;

  const calcTrimSide = (pct: number, side: "top" | "bottom"): Range => {
    const trim = Math.ceil(width * pct);
    return side === "top"
      ? { low: currentRange.low, high: currentRange.high - trim }
      : { low: currentRange.low + trim, high: currentRange.high };
  };

  const calcTrimBoth = (pct: number): Range => {
    const trim = Math.ceil(width * pct);
    return { low: currentRange.low + trim, high: currentRange.high - trim };
  };

  const handleQuickNarrow = (playerId: string, proposed: Range) => {
    applyNarrowing(playerId, proposed);
  };

  const timerPct = noLimit ? 100 : (timeLeft / timerDuration) * 100;
  const holder = holderId ? players.find((p) => p.id === holderId) : null;

  // Precompute trim targets for button labels
  const trim10bottom = calcTrimSide(0.1, "bottom");
  const trim10top = calcTrimSide(0.1, "top");
  const trim5both = calcTrimBoth(0.05);

  return (
    <div className="narrowing-phase">
      <h2 className="question-display">{question}</h2>

      <RangeVisual fullRange={initialRange} currentRange={currentRange} />

      {!noLimit && (
        <div className="timer-bar-container">
          <div
            className={`timer-bar ${timeLeft <= 5 ? "timer-danger" : ""}`}
            style={{ width: `${timerPct}%` }}
          />
          <span className="timer-text">{timeLeft}s</span>
        </div>
      )}

      <div className={`holder-banner ${holder ? "has-holder" : "no-holder"}`}>
        {holder ? (
          <>
            <span className="holder-dot" />
            <strong>{holder.name}</strong> holds the range
          </>
        ) : (
          "No one holds the range"
        )}
      </div>

      <div className="player-rows">
        {players.map((p) => (
          <div
            key={p.id}
            className={`player-row ${holderId === p.id ? "is-holder" : ""}`}
          >
            <span className="player-row-name">
              {p.name}
              {holderId === p.id && <span className="holder-badge">HOLDS</span>}
            </span>
            <div className="player-row-actions">
              <button
                className="btn-quick"
                onClick={() => handleQuickNarrow(p.id, trim10bottom)}
              >
                10% off bottom → {trim10bottom.low}
              </button>
              <button
                className="btn-quick"
                onClick={() => handleQuickNarrow(p.id, trim5both)}
              >
                5% off both → {trim5both.low}–{trim5both.high}
              </button>
              <button
                className="btn-quick"
                onClick={() => handleQuickNarrow(p.id, trim10top)}
              >
                10% off top → {trim10top.high}
              </button>
              <button
                className="btn-secondary btn-small"
                onClick={() => setSelectedPlayer(p.id)}
              >
                Custom
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPlayer && (
        <div className="custom-narrow">
          <span className="custom-narrow-label">
            Custom narrowing as <strong>{players.find((p) => p.id === selectedPlayer)?.name}</strong>:
          </span>
          <div className="custom-narrow-inputs">
            <div className="range-inputs">
              <input
                type="number"
                placeholder={String(currentRange.low)}
                value={inputLow}
                onChange={(e) => setInputLow(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleNarrow(); }}
              />
              <span className="range-separator">to</span>
              <input
                type="number"
                placeholder={String(currentRange.high)}
                value={inputHigh}
                onChange={(e) => setInputHigh(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleNarrow(); }}
              />
            </div>
            <button className="btn-primary" onClick={handleNarrow}>
              Narrow
            </button>
          </div>
        </div>
      )}

      <div className="round-actions" style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
        {narrowings.length > 0 && (
          <button className="btn-secondary btn-small" onClick={handleUndo}>
            Undo
          </button>
        )}
        <button className="btn-secondary btn-small" onClick={finish}>
          End Round
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {narrowings.length > 0 && (
        <div className="narrowing-log">
          <h3>History</h3>
          {narrowings.map((n, i) => {
            const name = players.find((p) => p.id === n.playerId)?.name || "?";
            return (
              <div key={i} className="log-entry">
                <strong>{name}</strong> → [{n.low} — {n.high}]
                <span className="log-width"> (width: {n.high - n.low})</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
