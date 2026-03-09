import { useState } from "react";
import type { Player, Round } from "../types";

interface Props {
  players: Player[];
  rounds: Round[];
  currentHolderId?: string | null;
  onAddPlayer?: (player: Player) => void;
}

export default function Scoreboard({ players, rounds, currentHolderId, onAddPlayer }: Props) {
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const scores: Record<string, number> = {};
  players.forEach((p) => (scores[p.id] = 0));
  rounds.forEach((r) => {
    if (r.holderId && r.result === "win") scores[r.holderId] = (scores[r.holderId] || 0) + 1;
    if (r.holderId && r.result === "loss") scores[r.holderId] = (scores[r.holderId] || 0) - 1;
  });

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed || players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return;
    onAddPlayer?.({ id: crypto.randomUUID(), name: trimmed });
    setNewName("");
    setShowInput(false);
  };

  return (
    <div className="scoreboard">
      <h3>Scores</h3>
      <div className="score-list">
        {players.map((p) => (
          <div
            key={p.id}
            className={`score-item ${currentHolderId === p.id ? "current-holder" : ""}`}
          >
            <span className="score-name">{p.name}</span>
            <span className="score-value">{scores[p.id] || 0}</span>
          </div>
        ))}
      </div>
      {onAddPlayer && (
        <div className="add-player-section">
          {showInput ? (
            <div className="add-player-form">
              <input
                type="text"
                placeholder="Player name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                autoFocus
              />
              <button className="btn-primary btn-small" onClick={handleAdd} disabled={!newName.trim()}>
                Add
              </button>
              <button className="btn-secondary btn-small" onClick={() => { setShowInput(false); setNewName(""); }}>
                Cancel
              </button>
            </div>
          ) : (
            <button className="btn-secondary btn-small" onClick={() => setShowInput(true)}>
              + Add Player
            </button>
          )}
        </div>
      )}
    </div>
  );
}
