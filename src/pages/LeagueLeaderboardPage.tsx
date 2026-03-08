import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { leaderboard } from '../api/client';
import type { LeaderboardEntryResponse } from '../api/client';

export function LeagueLeaderboardPage() {
  const { id } = useParams();
  const leagueId = Number(id);
  const [list, setList] = useState<LeaderboardEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    leaderboard.get(leagueId)
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, leagueId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[var(--color-accent-red)]">{error}</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] tracking-wide">Leaderboard</h2>
      {/* Mobile: cards */}
      <div className="sm:hidden space-y-2">
        {list.map((entry, i) => (
          <div
            key={entry.playerId}
            className={`card-felt p-4 ${i === 0 ? 'ring-1 ring-[var(--color-gold)]/40' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg font-bold text-[var(--color-gold)] shrink-0 w-7">{entry.rank}</span>
                <span className="font-medium text-[var(--color-cream)] truncate">{entry.playerName}</span>
              </div>
              <span className="text-xl font-bold text-[var(--color-accent-green)] shrink-0">{entry.points} pts</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-[var(--color-cream-dim)]">
              <span>P{entry.played}</span>
              <span>W{entry.wins} D{entry.draws} L{entry.losses}</span>
              <span className={entry.goalDifference >= 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
                GD {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop: table */}
      <div className="hidden sm:block card-felt overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-muted)] text-sm">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-center">P</th>
                <th className="px-4 py-3 text-center">W</th>
                <th className="px-4 py-3 text-center">D</th>
                <th className="px-4 py-3 text-center">L</th>
                <th className="px-4 py-3 text-center">GW</th>
                <th className="px-4 py-3 text-center">GL</th>
                <th className="px-4 py-3 text-center">GD</th>
                <th className="px-4 py-3 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {list.map((entry, i) => (
                <tr key={entry.playerId} className={`hover:bg-white/5 ${i === 0 ? 'bg-[var(--color-felt)]/30' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-[var(--color-gold)]">{entry.rank}</td>
                  <td className="px-4 py-3 font-medium text-[var(--color-cream)]">{entry.playerName}</td>
                  <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">{entry.played}</td>
                  <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">{entry.wins}</td>
                  <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">{entry.draws}</td>
                  <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">{entry.losses}</td>
                  <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">{entry.gamesWon}</td>
                  <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">{entry.gamesLost}</td>
                  <td className={`px-4 py-3 text-center ${entry.goalDifference >= 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>
                    {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[var(--color-accent-green)]">{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {list.length === 0 && (
        <p className="text-center text-gray-500">No standings yet. Add results to see the leaderboard.</p>
      )}
    </div>
  );
}
