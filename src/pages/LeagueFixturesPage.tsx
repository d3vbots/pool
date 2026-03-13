import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { matches, leaderboard } from '../api/client';
import { downloadFixturesPdf } from '../lib/downloadFixturesPdf';
import { getWeekDateRange } from '../lib/weekDateRange';
import { computeMatchOdds, getLeagueDrawRate } from '../lib/odds';
import type { MatchResponse, LeagueResponse, LeaderboardEntryResponse } from '../api/client';

export function LeagueFixturesPage() {
  const { id } = useParams();
  const leagueId = Number(id);
  const { league } = (useOutletContext() as { league?: LeagueResponse | null }) ?? {};
  const [list, setList] = useState<MatchResponse[]>([]);
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      matches.listByLeague(leagueId),
      leaderboard.get(leagueId).catch(() => [] as LeaderboardEntryResponse[]),
    ])
      .then(([matchList, lb]) => {
        setList(matchList);
        setLeaderboardList(lb);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, leagueId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[var(--color-accent-red)]">{error}</p>;
  }

  if (list.length === 0) {
    return (
      <div className="card-felt p-8 text-center text-[var(--color-cream-dim)]">
        No fixtures yet. Ensure league has enough players and click &quot;Generate Fixtures&quot; on the league page.
      </div>
    );
  }

  const useWeeks = list.some((m) => m.weekNumber != null);
  const groups: { key: string; label: string; matches: MatchResponse[] }[] = useWeeks
    ? (() => {
        const byWeek = list.reduce<Record<number, MatchResponse[]>>((acc, m) => {
          const w = m.weekNumber ?? 0;
          (acc[w] = acc[w] ?? []).push(m);
          return acc;
        }, {});
        return Object.entries(byWeek)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([week, matchesList]) => ({
            key: `week-${week}`,
            label: league?.startDate
              ? `Week ${week} (${getWeekDateRange(league.startDate, Number(week), league.endDate)}) — ${matchesList.length} match${matchesList.length === 1 ? '' : 'es'}`
              : `Week ${week} — ${matchesList.length} match${matchesList.length === 1 ? '' : 'es'}`,
            matches: matchesList,
          }));
      })()
    : (() => {
        const byLeg = list.reduce<Record<number, MatchResponse[]>>((acc, m) => {
          (acc[m.leg] = acc[m.leg] ?? []).push(m);
          return acc;
        }, {});
        return Object.entries(byLeg)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([leg, matchesList]) => ({
            key: `leg-${leg}`,
            label: `Leg ${leg}`,
            matches: matchesList,
          }));
      })();

  const handleDownloadPdf = () => {
    downloadFixturesPdf({
      leagueName: league?.name ?? `League ${leagueId}`,
      matches: list,
      startDate: league?.startDate,
      endDate: league?.endDate,
    });
  };

  const drawRate = getLeagueDrawRate(list);
  const entryByPlayerId = new Map<number, LeaderboardEntryResponse>(leaderboardList.map((e) => [e.playerId, e]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] tracking-wide">Fixtures</h2>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="btn-primary min-h-[44px] px-4 py-2.5 text-sm font-medium"
        >
          Download PDF
        </button>
      </div>
      {league && useWeeks && (
        <p className="text-sm text-[var(--color-cream-dim)]">
          Fixtures are spread across {new Set(list.map((m) => m.weekNumber).filter(Boolean)).size} weeks. Each week shows which games should be played in that period.
        </p>
      )}
      {list.some((m) => m.status === 'Pending') && (
        <p className="text-sm text-[var(--color-cream-dim)]">
          Odds are based on current league form (points per game) and draw rate. Lower odds = more likely.
        </p>
      )}
      <div className="space-y-6">
        {groups.map(({ key, label, matches: matchesList }) => (
          <div key={key}>
            <h3 className="text-sm text-[var(--color-gold)] mb-2 font-medium">{label}</h3>
            <div className="card-felt overflow-hidden">
              <div className="table-scroll">
                <table className="w-full text-left min-w-[320px]">
                  <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-muted)] text-sm">
                    <tr>
                      <th className="px-4 py-3">Player A</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3">Player B</th>
                      {list.some((m) => m.status === 'Pending') && <th className="px-4 py-3 text-center">Odds (A / D / B)</th>}
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {matchesList.map((m) => {
                      const odds = m.status === 'Pending'
                        ? computeMatchOdds(
                            entryByPlayerId.get(m.playerAId),
                            entryByPlayerId.get(m.playerBId),
                            drawRate
                          )
                        : null;
                      return (
                        <tr key={m.id} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-[var(--color-cream)]">{m.playerAName}</td>
                          <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">
                            {m.status === 'Completed' && m.playerAScore != null && m.playerBScore != null
                              ? `${m.playerAScore} – ${m.playerBScore}`
                              : '–'}
                          </td>
                          <td className="px-4 py-3 text-[var(--color-cream)]">{m.playerBName}</td>
                          {list.some((x) => x.status === 'Pending') && (
                            <td className="px-4 py-3 text-center text-[var(--color-cream-dim)] text-sm whitespace-nowrap">
                              {odds ? (
                                <span title="Player A win / Draw / Player B win (decimal odds)">
                                  <span className="text-[var(--color-cream)]">{odds.oddsPlayerA.toFixed(2)}</span>
                                  {' / '}
                                  <span>{odds.oddsDraw.toFixed(2)}</span>
                                  {' / '}
                                  <span className="text-[var(--color-cream)]">{odds.oddsPlayerB.toFixed(2)}</span>
                                </span>
                              ) : (
                                '–'
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <span className={m.status === 'Completed' ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-muted)]'}>
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
    </div>
  );
}
