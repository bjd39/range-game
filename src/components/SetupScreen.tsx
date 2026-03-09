import { useState, useRef } from "react";
import type { Player } from "../types";

interface Props {
  existingPlayers: Player[];
  onStart: (players: Player[], timerDuration: number) => void;
  onViewHistory: () => void;
}

export default function SetupScreen({ existingPlayers, onStart, onViewHistory }: Props) {
  const [names, setNames] = useState<string[]>(["", ""]);
  const timerOptions = [
    { value: 30, label: "30s" },
    { value: 60, label: "1m" },
    { value: 120, label: "2m" },
    { value: 180, label: "3m" },
    { value: 240, label: "4m" },
    { value: 300, label: "5m" },
    { value: 0, label: "No limit" },
  ];
  const [timerDuration, setTimerDuration] = useState(60);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const addPlayer = () => setNames([...names, ""]);
  const removePlayer = (i: number) => {
    if (names.length > 2) setNames(names.filter((_, idx) => idx !== i));
  };
  const updateName = (i: number, name: string) => {
    const next = [...names];
    next[i] = name;
    setNames(next);
  };
  const selectExisting = (i: number, name: string) => {
    updateName(i, name);
    setShowDropdown(null);
  };

  const validNames = names.map((n) => n.trim()).filter(Boolean);
  const canStart = validNames.length >= 2 && new Set(validNames).size === validNames.length;

  const handleStart = () => {
    const players: Player[] = validNames.map((name) => {
      const existing = existingPlayers.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      return existing || { id: crypto.randomUUID(), name };
    });
    onStart(players, timerDuration);
  };

  const getFilteredExisting = (i: number) => {
    const current = names[i].trim().toLowerCase();
    const otherNames = names.filter((_, idx) => idx !== i).map((n) => n.trim().toLowerCase());
    return existingPlayers.filter(
      (p) =>
        !otherNames.includes(p.name.toLowerCase()) &&
        (current === "" || p.name.toLowerCase().includes(current))
    );
  };

  return (
    <div className="setup-screen">
      <h1>Range Game</h1>
      <p className="subtitle">Narrow the range. Don't get caught.</p>

      <section className="setup-section">
        <h2>Players</h2>
        {names.map((name, i) => {
          const filtered = getFilteredExisting(i);
          const isOpen = showDropdown === i && filtered.length > 0;
          return (
            <div key={i} className="player-input-row">
              <div className="player-input-wrapper">
                <input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={name}
                  onChange={(e) => {
                    updateName(i, e.target.value);
                    setShowDropdown(i);
                  }}
                  onFocus={() => {
                    clearTimeout(blurTimeout.current);
                    setShowDropdown(i);
                  }}
                  onBlur={() => {
                    blurTimeout.current = setTimeout(() => setShowDropdown(null), 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canStart) handleStart();
                  }}
                />
                {isOpen && (
                  <div className="player-dropdown">
                    {filtered.map((p) => (
                      <button
                        key={p.id}
                        className="player-dropdown-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectExisting(i, p.name)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {names.length > 2 && (
                <button className="btn-icon" onClick={() => removePlayer(i)} title="Remove">
                  ×
                </button>
              )}
            </div>
          );
        })}
        {names.length < 8 && (
          <button className="btn-secondary" onClick={addPlayer}>
            + Add Player
          </button>
        )}
      </section>

      <section className="setup-section">
        <h2>Timer</h2>
        <div className="timer-options">
          {timerOptions.map((opt) => (
            <button
              key={opt.value}
              className={`timer-option ${timerDuration === opt.value ? "active" : ""}`}
              onClick={() => setTimerDuration(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <div className="setup-actions">
        <button className="btn-primary" disabled={!canStart} onClick={handleStart}>
          Start Game
        </button>
        <button className="btn-secondary" onClick={onViewHistory}>
          History & Stats
        </button>
      </div>
    </div>
  );
}
