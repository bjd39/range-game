import type { Player, Round } from "../types";

interface Props {
  players: Player[];
  rounds: Round[];
  currentHolderId?: string | null;
}

export default function Scoreboard({ players, rounds, currentHolderId }: Props) {
  const scores: Record<string, number> = {};
  players.forEach((p) => (scores[p.id] = 0));
  rounds.forEach((r) => {
    if (r.holderId && r.result === "win") scores[r.holderId] = (scores[r.holderId] || 0) + 1;
    if (r.holderId && r.result === "loss") scores[r.holderId] = (scores[r.holderId] || 0) - 1;
  });

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
    </div>
  );
}
