import { useState } from "react";
import type { GameStore } from "../types";
import RangeVisual from "./RangeVisual";
import Leaderboard from "./Leaderboard";
import { exportStore, importStore } from "../utils/storage";

interface Props {
  store: GameStore;
  onStoreUpdate: (store: GameStore) => void;
  onBack: () => void;
}

export default function SessionHistory({ store, onStoreUpdate, onBack }: Props) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const [tab, setTab] = useState<"history" | "leaderboard">("leaderboard");
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const json = exportStore();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `range-game-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const newStore = importStore(text);
        onStoreUpdate(newStore);
        setImportError(null);
      } catch {
        setImportError("Invalid file format.");
      }
    };
    input.click();
  };

  const playerName = (id: string) =>
    store.players.find((p) => p.id === id)?.name || "Unknown";

  return (
    <div className="session-history">
      <div className="history-header">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <h1>History & Stats</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === "leaderboard" ? "active" : ""}`}
          onClick={() => setTab("leaderboard")}
        >
          Leaderboard
        </button>
        <button
          className={`tab ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
        >
          Session History
        </button>
      </div>

      {tab === "leaderboard" && <Leaderboard store={store} />}

      {tab === "history" && (
        <div className="sessions-list">
          {store.sessions.length === 0 && (
            <p className="empty-state">No games played yet.</p>
          )}
          {[...store.sessions].reverse().map((session) => (
            <div key={session.id} className="session-card">
              <button
                className="session-toggle"
                onClick={() =>
                  setExpandedSession(
                    expandedSession === session.id ? null : session.id
                  )
                }
              >
                <span>
                  {new Date(session.date).toLocaleDateString()} —{" "}
                  {session.playerIds.map((id) => playerName(id)).join(", ")} —{" "}
                  {session.rounds.length} round{session.rounds.length !== 1 ? "s" : ""}
                </span>
                <span>{expandedSession === session.id ? "▾" : "▸"}</span>
              </button>

              {expandedSession === session.id && (
                <div className="session-rounds">
                  {session.rounds.map((round, i) => (
                    <div key={round.id} className="round-card">
                      <button
                        className="round-toggle"
                        onClick={() =>
                          setExpandedRound(
                            expandedRound === round.id ? null : round.id
                          )
                        }
                      >
                        <span>
                          R{i + 1}: {round.question}
                        </span>
                        <span
                          className={`result-badge ${
                            round.result === "win"
                              ? "badge-win"
                              : round.result === "loss"
                                ? "badge-loss"
                                : "badge-neutral"
                          }`}
                        >
                          {round.result === "win"
                            ? `✓ ${playerName(round.holderId!)}`
                            : round.result === "loss"
                              ? `✗ ${playerName(round.holderId!)}`
                              : "—"}
                        </span>
                      </button>

                      {expandedRound === round.id && (
                        <div className="round-detail">
                          <p>Answer: <strong>{round.answer}</strong> ({round.source})</p>
                          <RangeVisual
                            fullRange={round.initialRange}
                            currentRange={round.finalRange}
                            answer={round.answer}
                            showAnswer
                          />
                          {round.narrowings.length > 0 && (
                            <div className="narrowing-log compact">
                              {round.narrowings.map((n, j) => (
                                <div key={j} className="log-entry">
                                  <strong>{playerName(n.playerId)}</strong> → [
                                  {n.low} — {n.high}]
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="import-export">
        <button className="btn-secondary" onClick={handleExport}>
          Export Data
        </button>
        <button className="btn-secondary" onClick={handleImport}>
          Import Data
        </button>
        {importError && <span className="error-banner">{importError}</span>}
      </div>
    </div>
  );
}
