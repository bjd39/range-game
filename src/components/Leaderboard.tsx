import type { GameStore } from "../types";

interface Props {
  store: GameStore;
}

interface PlayerStats {
  name: string;
  totalPoints: number;
  roundsHeld: number;
  wins: number;
  losses: number;
  winRate: string;
}

export default function Leaderboard({ store }: Props) {
  const statsMap: Record<string, PlayerStats> = {};

  store.players.forEach((p) => {
    statsMap[p.id] = {
      name: p.name,
      totalPoints: 0,
      roundsHeld: 0,
      wins: 0,
      losses: 0,
      winRate: "—",
    };
  });

  store.sessions.forEach((session) => {
    session.rounds.forEach((round) => {
      if (round.holderId && statsMap[round.holderId]) {
        const s = statsMap[round.holderId];
        s.roundsHeld++;
        if (round.result === "win") {
          s.totalPoints++;
          s.wins++;
        } else if (round.result === "loss") {
          s.totalPoints--;
          s.losses++;
        }
      }
    });
  });

  const statsList = Object.values(statsMap)
    .map((s) => ({
      ...s,
      winRate: s.roundsHeld > 0 ? `${Math.round((s.wins / s.roundsHeld) * 100)}%` : "—",
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  if (statsList.length === 0) return <p className="empty-state">No players yet.</p>;

  return (
    <div className="leaderboard">
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Points</th>
            <th>Held</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {statsList.map((s) => (
            <tr key={s.name}>
              <td>{s.name}</td>
              <td>{s.totalPoints}</td>
              <td>{s.roundsHeld}</td>
              <td>{s.wins}</td>
              <td>{s.losses}</td>
              <td>{s.winRate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
