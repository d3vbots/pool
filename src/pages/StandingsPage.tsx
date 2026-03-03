import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { leagues, leaderboard } from '../api/client';
import { HeroPool } from '../components/HeroPool';
import type { LeagueResponse, LeaderboardEntryResponse } from '../api/client';

/** Public standings: list leagues and view a league's leaderboard (no login). */
export function StandingsPage() {
  const { leagueId } = useParams();
  const id = leagueId ? parseInt(leagueId, 10) : null;

  if (id != null && !Number.isNaN(id)) {
    return <LeagueStandingsView leagueId={id} />;
  }
  return <StandingsLeagueList />;
}

function StandingsLeagueList() {
  const [list, setList] = useState<LeagueResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    leagues.list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-gold)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-felt p-4 border-[var(--color-accent-red)]/50 text-[var(--color-accent-red)]">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <HeroPool title="Standings" subtitle="Pick a league and see who’s on top." compact />
      <p className="text-[var(--color-cream-dim)] text-sm sm:text-base">Select a league to view the leaderboard.</p>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((league) => (
          <Link
            key={league.id}
            to={`/standings/${league.id}`}
            className="card-felt block p-4 sm:p-5 transition min-h-[44px] active:opacity-90"
          >
            <h3 className="font-semibold text-[var(--color-cream)]">{league.name}</h3>
            <p className="mt-1 text-sm text-[var(--color-cream-dim)]">{league.playerCount} players · <span className="text-[var(--color-gold)]">{league.status}</span></p>
          </Link>
        ))}
      </div>
      {list.length === 0 && (
        <p className="text-center text-[var(--color-muted)]">No leagues yet.</p>
      )}
    </div>
  );
}

function LeagueStandingsView({ leagueId }: { leagueId: number }) {
  const [league, setLeague] = useState<LeagueResponse | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([leagues.get(leagueId), leaderboard.get(leagueId)])
      .then(([l, e]) => {
        setLeague(l);
        setEntries(e);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [leagueId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-gold)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-felt p-4 border-[var(--color-accent-red)]/50 text-[var(--color-accent-red)]">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/standings" className="min-h-[44px] flex items-center text-[var(--color-cream-dim)] hover:text-[var(--color-gold)] transition">← All leagues</Link>
        <h1 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] tracking-wide">{league?.name ?? 'Standings'}</h1>
      </div>
      {/* Mobile: cards */}
      <div className="sm:hidden space-y-2">
        {entries.map((entry, i) => (
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
        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
              {entries.map((entry, i) => (
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
      {entries.length === 0 && (
        <p className="text-center text-[var(--color-muted)]">No standings yet.</p>
      )}
    </div>
  );
}
