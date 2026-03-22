import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { leagues, leaderboard, matches } from '../api/client';
import { HeroPool } from '../components/HeroPool';
import { POOL_IMAGES } from '../lib/poolImages';
import { downloadFixturesPdf } from '../lib/downloadFixturesPdf';
import { getWeekDateRange } from '../lib/weekDateRange';
import { formatMatchScoreDisplay } from '../lib/matchDisplay';
import { computeMatchOdds, getLeagueDrawRate } from '../lib/odds';
import type { LeagueResponse, LeaderboardEntryResponse, MatchResponse } from '../api/client';

/** Read-only fixtures and results for public view; groups by week when weekNumber is set. Shows odds for pending matches when leaderboard is provided. */
function FixturesAndResultsPublic({
  matches: matchList,
  league,
  leaderboardEntries = [],
}: {
  matches: MatchResponse[];
  league?: LeagueResponse | null;
  leaderboardEntries?: LeaderboardEntryResponse[];
}) {
  const useWeeks = matchList.some((m) => m.weekNumber != null);
  const drawRate = getLeagueDrawRate(matchList);
  const entryByPlayerId = new Map<number, LeaderboardEntryResponse>(leaderboardEntries.map((e) => [e.playerId, e]));
  const showOdds = matchList.some((m) => m.status === 'Pending') && leaderboardEntries.length > 0;

  const groups: { key: string; label: string; list: MatchResponse[] }[] = useWeeks
    ? (() => {
        const byWeek = matchList.reduce<Record<number, MatchResponse[]>>((acc, m) => {
          const w = m.weekNumber ?? 0;
          (acc[w] = acc[w] ?? []).push(m);
          return acc;
        }, {});
        return Object.entries(byWeek)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([week, list]) => ({
            key: `week-${week}`,
            label: league?.startDate
              ? `Week ${week} (${getWeekDateRange(league.startDate, Number(week), league.endDate)})`
              : `Week ${week}`,
            list,
          }));
      })()
    : (() => {
        const byLeg = matchList.reduce<Record<number, MatchResponse[]>>((acc, m) => {
          (acc[m.leg] = acc[m.leg] ?? []).push(m);
          return acc;
        }, {});
        return Object.entries(byLeg)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([leg, list]) => ({ key: `leg-${leg}`, label: `Leg ${leg}`, list }));
      })();

  return (
    <div className="space-y-6">
      {groups.map(({ key, label, list }) => (
        <div key={key}>
          <h3 className="text-sm text-[var(--color-gold)] font-medium mb-2">{label}</h3>
          <div className="card-felt overflow-hidden">
            <div className="table-scroll">
              <table className="w-full text-left min-w-[320px]">
                <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-muted)] text-sm">
                  <tr>
                    <th className="px-4 py-3">Match</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    {showOdds && <th className="px-4 py-3 text-center">Odds (A / D / B)</th>}
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {list.map((m) => {
                    const odds = showOdds && m.status === 'Pending'
                      ? computeMatchOdds(entryByPlayerId.get(m.playerAId), entryByPlayerId.get(m.playerBId), drawRate)
                      : null;
                    return (
                      <tr key={m.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-[var(--color-cream)]">
                          <Link to={`/player/${m.playerAId}`} className="hover:text-[var(--color-gold)] transition underline underline-offset-2">{m.playerAName}</Link>
                          {' vs '}
                          <Link to={`/player/${m.playerBId}`} className="hover:text-[var(--color-gold)] transition underline underline-offset-2">{m.playerBName}</Link>
                        </td>
                        <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">
                          {formatMatchScoreDisplay(m)}
                        </td>
                        {showOdds && (
                          <td className="px-4 py-3 text-center text-[var(--color-cream-dim)] text-sm whitespace-nowrap" title="Player A win / Draw / Player B win (based on league form)">
                            {odds ? (
                              <span>
                                <span className="text-[var(--color-cream)]">{odds.oddsPlayerA.toFixed(2)}</span>
                                {' / '}
                                {odds.oddsDraw.toFixed(2)}
                                {' / '}
                                <span className="text-[var(--color-cream)]">{odds.oddsPlayerB.toFixed(2)}</span>
                              </span>
                            ) : (
                              '–'
                            )}
                          </td>
                        )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Public standings: list leagues and view a league's leaderboard (no login). */
export function StandingsPage() {
  const { leagueId } = useParams();
  const id = leagueId ? parseInt(leagueId, 10) : null;

  if (id != null && !Number.isNaN(id)) {
    return <LeagueStandingsView leagueId={id} />;
  }
  return <StandingsLeagueList />;
}

const SEARCH_DEBOUNCE_MS = 300;

function StandingsLeagueList() {
  const [list, setList] = useState<LeagueResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    leagues.list({ public: true, q: searchQuery || undefined })
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="spinner" />
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
      <HeroPool title="Standings" subtitle="Pick a league and see who’s on top." imageUrl={POOL_IMAGES.hero} compact />
      <p className="text-[var(--color-cream-dim)] text-sm sm:text-base">Select a league to view the leaderboard.</p>
      <div className="max-w-md">
        <label htmlFor="standings-league-search" className="sr-only">Search leagues</label>
        <input
          id="standings-league-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search leagues…"
          className="w-full min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-2.5 text-[var(--color-cream)] placeholder-[var(--color-muted)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/30 focus:outline-none"
        />
      </div>
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
        <p className="text-center text-[var(--color-muted)]">{searchQuery ? 'No leagues match your search.' : 'No leagues yet.'}</p>
      )}
    </div>
  );
}

function LeagueStandingsView({ leagueId }: { leagueId: number }) {
  const [league, setLeague] = useState<LeagueResponse | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntryResponse[]>([]);
  const [matchList, setMatchList] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([leagues.get(leagueId, { public: true }), leaderboard.get(leagueId), matches.listByLeague(leagueId)])
      .then(([l, e, m]) => {
        setLeague(l);
        setEntries(e);
        setMatchList(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [leagueId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="spinner" />
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
                <Link to={`/player/${entry.playerId}`} className="font-medium text-[var(--color-cream)] truncate hover:text-[var(--color-gold)] transition underline underline-offset-2">
                  {entry.playerName}
                </Link>
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
              {entries.map((entry, i) => (
                <tr key={entry.playerId} className={`hover:bg-white/5 ${i === 0 ? 'bg-[var(--color-felt)]/30' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-[var(--color-gold)]">{entry.rank}</td>
                  <td className="px-4 py-3">
                    <Link to={`/player/${entry.playerId}`} className="font-medium text-[var(--color-cream)] hover:text-[var(--color-gold)] transition underline underline-offset-2">
                      {entry.playerName}
                    </Link>
                  </td>
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

      {/* Fixtures & Results (read-only for public) */}
      {matchList.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <h2 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] tracking-wide">Fixtures & results</h2>
            <button
              type="button"
              onClick={() => downloadFixturesPdf({
                leagueName: league?.name ?? 'League',
                matches: matchList,
                startDate: league?.startDate,
                endDate: league?.endDate,
              })}
              className="btn-primary min-h-[44px] px-4 py-2.5 text-sm font-medium"
            >
              Download PDF
            </button>
          </div>
          {matchList.some((m) => m.status === 'Pending') && (
            <p className="text-sm text-[var(--color-cream-dim)] -mt-1 mb-2">
              Odds are based on current league form (points per game). Lower odds = more likely. For fun only.
            </p>
          )}
          <FixturesAndResultsPublic matches={matchList} league={league} leaderboardEntries={entries} />
        </>
      )}
    </div>
  );
}
