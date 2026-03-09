import { useState, useEffect, useCallback } from "react";
import type { Player, Narrowing, Range, QuestionType } from "../types";
import { validateNarrowing } from "../utils/validation";
import { formatDateValue, formatDateWidth, getDatePrecision, datePartsToDecimalYear, decimalYearToDate } from "../utils/dateFormat";
import RangeVisual from "./RangeVisual";

interface Props {
  question: string;
  initialRange: Range;
  initialHolderId?: string | null;
  players: Player[];
  timerDuration: number;
  questionType?: QuestionType;
  onComplete: (narrowings: Narrowing[], finalRange: Range, holderId: string | null) => void;
}

export default function NarrowingPhase({
  question,
  initialRange,
  initialHolderId,
  players,
  timerDuration,
  questionType,
  onComplete,
}: Props) {
  const [currentRange, setCurrentRange] = useState<Range>(initialRange);
  const [narrowings, setNarrowings] = useState<Narrowing[]>([]);
  const [holderId, setHolderId] = useState<string | null>(initialHolderId ?? null);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [selectedPlayer, setSelectedPlayer] = useState(players[0].id);
  const [inputLow, setInputLow] = useState("");
  const [inputHigh, setInputHigh] = useState("");
  // Date input fields
  const [inputLowYear, setInputLowYear] = useState("");
  const [inputLowMonth, setInputLowMonth] = useState("");
  const [inputLowDay, setInputLowDay] = useState("");
  const [inputHighYear, setInputHighYear] = useState("");
  const [inputHighMonth, setInputHighMonth] = useState("");
  const [inputHighDay, setInputHighDay] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isDate = questionType === "date";

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
    setInputLowYear(""); setInputLowMonth(""); setInputLowDay("");
    setInputHighYear(""); setInputHighMonth(""); setInputHighDay("");
    setError(null);
  };

  const applyNarrowing = (playerId: string, proposed: Range) => {
    const err = validateNarrowing(currentRange, proposed, questionType);
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
    setInputLowYear(""); setInputLowMonth(""); setInputLowDay("");
    setInputHighYear(""); setInputHighMonth(""); setInputHighDay("");
    setSelectedPlayer(playerId);
    setError(null);
  };

  const parseDateInput = (yearStr: string, monthStr: string, dayStr: string, fallback: number): number => {
    if (!yearStr) return fallback;
    const year = Number(yearStr);
    const month = monthStr ? Number(monthStr) : undefined;
    const day = dayStr ? Number(dayStr) : undefined;
    return datePartsToDecimalYear(year, month, day);
  };

  const handleNarrow = () => {
    let proposed: Range;
    if (isDate && precision !== "year") {
      proposed = {
        low: parseDateInput(inputLowYear, inputLowMonth, inputLowDay, currentRange.low),
        high: parseDateInput(inputHighYear, inputHighMonth, inputHighDay, currentRange.high),
      };
    } else {
      proposed = {
        low: inputLow !== "" ? Number(inputLow) : currentRange.low,
        high: inputHigh !== "" ? Number(inputHigh) : currentRange.high,
      };
    }
    applyNarrowing(selectedPlayer, proposed);
  };

  const width = currentRange.high - currentRange.low;
  const precision = isDate ? getDatePrecision(width) : null;

  const fmtVal = (v: number) => isDate ? formatDateValue(v, width) : String(v);
  const fmtWidth = (w: number) => isDate ? formatDateWidth(w) : String(w);

  const calcTrimSide = (pct: number, side: "top" | "bottom"): Range => {
    const trim = isDate ? width * pct : Math.ceil(width * pct);
    return side === "top"
      ? { low: currentRange.low, high: currentRange.high - trim }
      : { low: currentRange.low + trim, high: currentRange.high };
  };

  const calcTrimBoth = (pct: number): Range => {
    const trim = isDate ? width * pct : Math.ceil(width * pct);
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

      <RangeVisual fullRange={initialRange} currentRange={currentRange} questionType={questionType} />

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
                <span className="btn-quick-full">10% off bottom → {fmtVal(trim10bottom.low)}</span>
                <span className="btn-quick-short">↑{fmtVal(trim10bottom.low)}</span>
              </button>
              <button
                className="btn-quick"
                onClick={() => handleQuickNarrow(p.id, trim5both)}
              >
                <span className="btn-quick-full">5% off both → {fmtVal(trim5both.low)}–{fmtVal(trim5both.high)}</span>
                <span className="btn-quick-short">↑↓5%</span>
              </button>
              <button
                className="btn-quick"
                onClick={() => handleQuickNarrow(p.id, trim10top)}
              >
                <span className="btn-quick-full">10% off top → {fmtVal(trim10top.high)}</span>
                <span className="btn-quick-short">↓{fmtVal(trim10top.high)}</span>
              </button>
              <button
                className="btn-secondary btn-small"
                onClick={() => setSelectedPlayer(p.id)}
              >
                <span className="btn-quick-full">Custom</span>
                <span className="btn-quick-short">...</span>
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
            {isDate && precision !== "year" ? (
              <div className="date-range-inputs">
                <DateInput
                  label="From"
                  precision={precision!}
                  yearVal={inputLowYear}
                  monthVal={inputLowMonth}
                  dayVal={inputLowDay}
                  onYearChange={setInputLowYear}
                  onMonthChange={setInputLowMonth}
                  onDayChange={setInputLowDay}
                  placeholder={decimalYearToDate(currentRange.low)}
                  onEnter={handleNarrow}
                />
                <span className="range-separator">to</span>
                <DateInput
                  label="To"
                  precision={precision!}
                  yearVal={inputHighYear}
                  monthVal={inputHighMonth}
                  dayVal={inputHighDay}
                  onYearChange={setInputHighYear}
                  onMonthChange={setInputHighMonth}
                  onDayChange={setInputHighDay}
                  placeholder={decimalYearToDate(currentRange.high)}
                  onEnter={handleNarrow}
                />
              </div>
            ) : (
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder={isDate ? fmtVal(currentRange.low) : String(currentRange.low)}
                  value={inputLow}
                  onChange={(e) => setInputLow(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleNarrow(); }}
                />
                <span className="range-separator">to</span>
                <input
                  type="number"
                  placeholder={isDate ? fmtVal(currentRange.high) : String(currentRange.high)}
                  value={inputHigh}
                  onChange={(e) => setInputHigh(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleNarrow(); }}
                />
              </div>
            )}
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
            const nWidth = n.high - n.low;
            return (
              <div key={i} className="log-entry">
                <strong>{name}</strong> → [{isDate ? formatDateValue(n.low, nWidth) : n.low} — {isDate ? formatDateValue(n.high, nWidth) : n.high}]
                <span className="log-width"> (width: {fmtWidth(nWidth)})</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function DateInput({ label, precision, yearVal, monthVal, dayVal, onYearChange, onMonthChange, onDayChange, placeholder, onEnter }: {
  label: string;
  precision: "month" | "day";
  yearVal: string;
  monthVal: string;
  dayVal: string;
  onYearChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
  placeholder: Date;
  onEnter: () => void;
}) {
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") onEnter(); };
  return (
    <div className="date-input-group">
      <span className="date-input-label">{label}</span>
      {precision === "day" && (
        <input
          type="number"
          className="date-input-day"
          placeholder={String(placeholder.getDate())}
          value={dayVal}
          onChange={(e) => onDayChange(e.target.value)}
          onKeyDown={handleKey}
          min={1}
          max={31}
        />
      )}
      <select
        className="date-input-month"
        value={monthVal}
        onChange={(e) => onMonthChange(e.target.value)}
        onKeyDown={handleKey}
      >
        <option value="">{MONTH_NAMES[placeholder.getMonth()]}</option>
        {MONTH_NAMES.map((m, i) => (
          <option key={m} value={String(i)}>{m}</option>
        ))}
      </select>
      <input
        type="number"
        className="date-input-year"
        placeholder={String(placeholder.getFullYear())}
        value={yearVal}
        onChange={(e) => onYearChange(e.target.value)}
        onKeyDown={handleKey}
      />
    </div>
  );
}
