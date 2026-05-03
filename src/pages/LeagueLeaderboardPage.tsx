import { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { leaderboard } from '../api/client';
import { LeaderboardLegend } from '../components/LeaderboardLegend';
import { LeaderboardTop8CutRow } from '../components/LeaderboardTop8CutRow';
import {
  leaderboardCardClass,
  leaderboardTableRowClass,
  shouldShowTop8CutLine,
} from '../lib/standingsVisual';
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

  const standingTotal = list.length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] tracking-wide">Leaderboard</h2>
      {/* Mobile: cards */}
      <div className="sm:hidden space-y-2">
        {list.map((entry) => (
          <Fragment key={entry.playerId}>
            {shouldShowTop8CutLine(entry.rank, standingTotal) && (
              <div
                role="separator"
                className="mx-1 border-t border-dashed border-[var(--color-gold)]/65"
                aria-label="Cut after top eight"
              />
            )}
            <div className={leaderboardCardClass(entry.rank, standingTotal)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg font-bold text-[var(--color-gold)] shrink-0 w-8 tabular-nums">
                    {entry.rank === 1 ? '👑 ' : ''}
                    {entry.rank}
                  </span>
                  <span className="font-medium text-[var(--color-cream)] truncate">{entry.playerName}</span>
                </div>
                <span className="text-xl font-bold text-[var(--color-accent-green)] shrink-0">{entry.points} pts</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-[var(--color-cream-dim)]">
                <span>P{entry.played}</span>
                <span>W{entry.wins} D{entry.draws} L{entry.losses}</span>
                <span title="Green apples (break-and-finish)">🍏 {entry.apples ?? 0}</span>
                <span className={entry.goalDifference >= 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
                  GD {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
                </span>
              </div>
            </div>
          </Fragment>
        ))}
        {standingTotal > 0 && (
          <div className="mt-3 px-1 py-2 rounded-lg bg-black/15 border border-[var(--color-border)]/50">
            <LeaderboardLegend totalPlayers={standingTotal} />
          </div>
        )}
      </div>
      {/* Desktop: table */}
      <div className="hidden sm:block card-felt overflow-hidden ring-1 ring-[var(--color-border)]/80">
        <div className="table-scroll">
          <table className="w-full text-left min-w-[500px] border-collapse">
            <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-muted)] text-sm border-b border-[var(--color-border)]">
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
                <th className="px-4 py-3 text-center" title="Green apples (break-and-finish)">🍏</th>
                <th className="px-4 py-3 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {list.map((entry) => (
                <Fragment key={entry.playerId}>
                  {shouldShowTop8CutLine(entry.rank, standingTotal) && <LeaderboardTop8CutRow />}
                  <tr
                    className={`border-b border-[var(--color-border)]/70 transition-colors hover:brightness-[1.03] ${leaderboardTableRowClass(entry.rank, standingTotal)}`}
                  >
                  <td className="px-4 py-3 font-semibold text-[var(--color-gold)] tabular-nums">
                    {entry.rank === 1 && <span className="mr-1" aria-hidden>👑</span>}
                    {entry.rank}
                  </td>
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
                  <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">{entry.apples ?? 0}</td>
                  <td className="px-4 py-3 text-right font-bold text-[var(--color-accent-green)]">{entry.points}</td>
                </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {standingTotal > 0 && (
          <div className="px-4 py-3 border-t border-[var(--color-border)]/80 bg-black/20">
            <LeaderboardLegend totalPlayers={standingTotal} />
          </div>
        )}
      </div>
      {list.length === 0 && (
        <p className="text-center text-gray-500">No standings yet. Add results to see the leaderboard.</p>
      )}
    </div>
  );
}
