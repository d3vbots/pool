import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { players } from '../api/client';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore';
import { formatMatchScoreDisplay, isMatchRecorded } from '../lib/matchDisplay';
import type {
  PlayerResponse,
  PlayerLeagueEntryResponse,
  MatchResponse,
} from '../api/client';

export function PlayerDetailPage() {
  const { id } = useParams();
  const isAuth = useAuthStore(selectIsAuthenticated);
  const playerId = id ? parseInt(id, 10) : NaN;
  const [player, setPlayer] = useState<PlayerResponse | null>(null);
  const [leagues, setLeagues] = useState<PlayerLeagueEntryResponse[]>([]);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || Number.isNaN(playerId)) {
      setLoading(false);
      return;
    }
    Promise.all([
      players.get(playerId),
      players.getLeagues(playerId),
      players.getMatches(playerId),
    ])
      .then(([p, l, m]) => {
        setPlayer(p);
        setLeagues(l);
        setMatches(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, playerId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="space-y-4">
        <Link to={isAuth ? '/players' : '/standings'} className="min-h-[44px] flex items-center text-[var(--color-cream-dim)] hover:text-[var(--color-gold)] transition w-fit">
          ← {isAuth ? 'Players' : 'Standings'}
        </Link>
        <p className="text-[var(--color-accent-red)]">{error || 'Player not found.'}</p>
      </div>
    );
  }

  // Group matches by league, then by week (or leg if no weekNumber)
  const matchesByLeague = matches.reduce<Record<number, MatchResponse[]>>((acc, m) => {
    (acc[m.leagueId] = acc[m.leagueId] ?? []).push(m);
    return acc;
  }, {});
  const leagueIdsWithMatches = Object.keys(matchesByLeague).map(Number);

  const useWeeks = matches.some((m) => m.weekNumber != null);

  function groupByWeekOrLeg(list: MatchResponse[]): { key: string; label: string; list: MatchResponse[]; completed: number }[] {
    if (useWeeks) {
      const byWeek = list.reduce<Record<number, MatchResponse[]>>((acc, m) => {
        const w = m.weekNumber ?? 0;
        (acc[w] = acc[w] ?? []).push(m);
        return acc;
      }, {});
      return Object.entries(byWeek)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([week, weekMatches]) => {
          const completed = weekMatches.filter((m) => isMatchRecorded(m)).length;
          const weekNum = Number(week);
          const label = weekNum === 0 ? 'Unassigned' : `Week ${weekNum}`;
          return {
            key: `week-${week}`,
            label: `${label} — ${completed}/${weekMatches.length} completed`,
            list: weekMatches,
            completed,
          };
        });
    }
    const byLeg = list.reduce<Record<number, MatchResponse[]>>((acc, m) => {
      (acc[m.leg] = acc[m.leg] ?? []).push(m);
      return acc;
    }, {});
    return Object.entries(byLeg)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([leg, legMatches]) => {
        const completed = legMatches.filter((m) => isMatchRecorded(m)).length;
        return {
          key: `leg-${leg}`,
          label: `Leg ${leg} — ${completed}/${legMatches.length} completed`,
          list: legMatches,
          completed,
        };
      });
  }

  return (
    <div className="space-y-6">
      <Link to={isAuth ? '/players' : '/standings'} className="min-h-[44px] flex items-center text-[var(--color-cream-dim)] hover:text-[var(--color-gold)] transition w-fit">
        ← {isAuth ? 'Players' : 'Standings'}
      </Link>

      {/* Player details */}
      <div className="card-felt p-6">
        <h1 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] tracking-wide">
          {player.name}
        </h1>
        <dl className="mt-4 space-y-2 text-sm">
          {player.profileImageUrl && (
            <div>
              <dt className="text-[var(--color-muted)]">Photo</dt>
              <dd>
                <img
                  src={player.profileImageUrl}
                  alt={player.name}
                  className="mt-1 h-20 w-20 rounded-lg object-cover"
                />
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Leagues */}
      <section>
        <h2 className="font-display text-lg sm:text-xl text-[var(--color-cream)] tracking-wide mb-3">
          Leagues
        </h2>
        {leagues.length === 0 ? (
          <p className="text-[var(--color-cream-dim)] text-sm">Not in any league yet.</p>
        ) : (
          <div className="space-y-2">
            {leagues.map((entry) => (
              <Link
                key={entry.leagueId}
                to={isAuth ? `/leagues/${entry.leagueId}` : `/standings/${entry.leagueId}`}
                className="card-felt block p-4 transition min-h-[44px] active:opacity-90"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[var(--color-cream)]">{entry.leagueName}</span>
                  <span className="text-sm text-[var(--color-gold)]">{entry.leagueStatus}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--color-cream-dim)]">
                  <span>P{entry.played}</span>
                  <span>W{entry.wins} D{entry.draws} L{entry.losses}</span>
                  <span className={entry.goalDifference >= 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
                    GD {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
                  </span>
                  <span className="font-semibold text-[var(--color-accent-green)]">{entry.points} pts</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Fixtures / matches */}
      <section>
        <h2 className="font-display text-lg sm:text-xl text-[var(--color-cream)] tracking-wide mb-3">
          Fixtures & results
        </h2>
        {matches.length === 0 ? (
          <p className="text-[var(--color-cream-dim)] text-sm">No fixtures yet.</p>
        ) : (
          <div className="space-y-6">
            {leagueIdsWithMatches.map((leagueId) => {
              const list = matchesByLeague[leagueId];
              const leagueName = list?.[0]?.leagueName ?? `League ${leagueId}`;
              const weekGroups = groupByWeekOrLeg(list ?? []);
              return (
                <div key={leagueId} className="space-y-4">
                  <h3 className="text-sm text-[var(--color-gold)] font-medium">{leagueName}</h3>
                  {weekGroups.map(({ key, label, list: weekList }) => (
                    <div key={key}>
                      <h4 className="text-xs font-medium text-[var(--color-cream-dim)] mb-1.5">{label}</h4>
                      <div className="card-felt overflow-hidden">
                        <div className="table-scroll">
                          <table className="w-full text-left min-w-[280px]">
                            <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-muted)] text-sm">
                              <tr>
                                <th className="px-4 py-3">Match</th>
                                <th className="px-4 py-3 text-center">Score</th>
                                <th className="px-4 py-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                              {weekList.map((m) => (
                                <tr key={m.id} className="hover:bg-white/5">
                                  <td className="px-4 py-3 text-[var(--color-cream)]">
                                    {m.playerAName} vs {m.playerBName}
                                  </td>
                                  <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">
                                    {formatMatchScoreDisplay(m)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={
                                        m.status === 'Completed'
                                          ? 'text-[var(--color-accent-green)]'
                                          : m.status === 'Abandoned'
                                            ? 'text-[var(--color-gold)]'
                                            : 'text-[var(--color-muted)]'
                                      }
                                    >
                                      {m.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
