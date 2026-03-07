import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { matches } from '../api/client';
import { downloadFixturesPdf } from '../lib/downloadFixturesPdf';
import type { MatchResponse, LeagueResponse } from '../api/client';

/** Format week date range from league start (e.g. "Jan 1 – Jan 7"). */
function getWeekDateRange(startDateIso: string, weekNumber: number, endDateIso?: string): string {
  const start = new Date(startDateIso);
  const weekStart = new Date(start);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
  let weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  if (endDateIso) {
    const end = new Date(endDateIso);
    if (weekEnd > end) weekEnd = end;
  }
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

export function LeagueFixturesPage() {
  const { id } = useParams();
  const leagueId = Number(id);
  const { league } = (useOutletContext() as { league?: LeagueResponse | null }) ?? {};
  const [list, setList] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    matches.listByLeague(leagueId)
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, leagueId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-gold)] border-t-transparent" />
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
      <div className="space-y-6">
        {groups.map(({ key, label, matches: matchesList }) => (
          <div key={key}>
            <h3 className="text-sm text-[var(--color-gold)] mb-2 font-medium">{label}</h3>
            <div className="card-felt overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[320px]">
                  <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-muted)] text-sm">
                    <tr>
                      <th className="px-4 py-3">Player A</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3">Player B</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {matchesList.map((m) => (
                      <tr key={m.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-[var(--color-cream)]">{m.playerAName}</td>
                        <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">
                          {m.status === 'Completed' && m.playerAScore != null && m.playerBScore != null
                            ? `${m.playerAScore} – ${m.playerBScore}`
                            : '–'}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-cream)]">{m.playerBName}</td>
                        <td className="px-4 py-3">
                          <span className={m.status === 'Completed' ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-muted)]'}>
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
    </div>
  );
}
