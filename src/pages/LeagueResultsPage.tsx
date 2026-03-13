import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { matches, leaderboard } from '../api/client';
import { getWeekDateRange } from '../lib/weekDateRange';
import { computeMatchOdds, getLeagueDrawRate } from '../lib/odds';
import type { MatchResponse, LeagueResponse, LeaderboardEntryResponse } from '../api/client';

export function LeagueResultsPage() {
  const { id } = useParams();
  const leagueId = Number(id);
  const [list, setList] = useState<MatchResponse[]>([]);
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = () => {
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
  };

  useEffect(() => {
    load();
  }, [id, leagueId]);

  const { league } = (useOutletContext() as { league?: LeagueResponse | null }) ?? {};
  const pending = list.filter((m) => m.status === 'Pending');
  const completed = list.filter((m) => m.status === 'Completed');

  const useWeeks = list.some((m) => m.weekNumber != null);

  function groupByWeekOrLeg(matchList: MatchResponse[]): { key: string; label: string; list: MatchResponse[] }[] {
    if (matchList.length === 0) return [];
    if (useWeeks) {
      const byWeek = matchList.reduce<Record<number, MatchResponse[]>>((acc, m) => {
        const w = m.weekNumber ?? 0;
        (acc[w] = acc[w] ?? []).push(m);
        return acc;
      }, {});
      return Object.entries(byWeek)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([week, weekList]) => {
          const weekNum = Number(week);
          const label = weekNum === 0
            ? `Unassigned — ${weekList.length} match${weekList.length === 1 ? '' : 'es'}`
            : league?.startDate
              ? `Week ${weekNum} (${getWeekDateRange(league.startDate, weekNum, league.endDate)}) — ${weekList.length} match${weekList.length === 1 ? '' : 'es'}`
              : `Week ${weekNum} — ${weekList.length} match${weekList.length === 1 ? '' : 'es'}`;
          return { key: `week-${week}`, label, list: weekList };
        });
    }
    const byLeg = matchList.reduce<Record<number, MatchResponse[]>>((acc, m) => {
      (acc[m.leg] = acc[m.leg] ?? []).push(m);
      return acc;
    }, {});
    return Object.entries(byLeg)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([leg, legList]) => ({
        key: `leg-${leg}`,
        label: `Leg ${leg} — ${legList.length} match${legList.length === 1 ? '' : 'es'}`,
        list: legList,
      }));
  }

  const pendingByWeek = groupByWeekOrLeg(pending);
  const completedByWeek = groupByWeekOrLeg(completed);

  const drawRate = getLeagueDrawRate(list);
  const entryByPlayerId = new Map<number, LeaderboardEntryResponse>(leaderboardList.map((e) => [e.playerId, e]));

  const openEdit = (m: MatchResponse) => {
    setEditingId(m.id);
    setScoreA(m.playerAScore ?? 0);
    setScoreB(m.playerBScore ?? 0);
  };

  const closeEdit = () => {
    setEditingId(null);
    setScoreA(0);
    setScoreB(0);
  };

  const submitResult = async (matchId: number) => {
    setSaving(true);
    setError('');
    try {
      await matches.setResult(matchId, scoreA, scoreB);
      closeEdit();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteResult = async (matchId: number) => {
    if (!confirm('Delete this result? Stats will be reverted.')) return;
    setError('');
    try {
      await matches.deleteResult(matchId);
      closeEdit();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  const touchBtn = 'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg px-4 py-2.5 text-base font-medium';
  const touchInput = 'w-14 h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-2 text-center text-[var(--color-cream)] text-lg focus:border-[var(--color-gold)] focus:outline-none';

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] tracking-wide">Enter results</h2>
      {error && <p className="text-sm text-[var(--color-accent-red)]">{error}</p>}

      {pendingByWeek.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--color-muted)]">Pending</h3>
          {pendingByWeek.map(({ key, label, list: weekList }) => (
            <div key={key} className="card-felt overflow-hidden">
              <h4 className="px-3 sm:px-4 py-2 text-sm text-[var(--color-gold)] bg-[var(--color-surface-elevated)]">{label}</h4>
              <div className="divide-y divide-[var(--color-border)]">
                {weekList.map((m) => {
                  const odds = computeMatchOdds(
                    entryByPlayerId.get(m.playerAId),
                    entryByPlayerId.get(m.playerBId),
                    drawRate
                  );
                  return (
                    <div key={m.id} className="px-3 sm:px-4 py-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <span className="text-white font-medium truncate">{m.playerAName}</span>
                        {editingId === m.id ? (
                          <>
                            <input type="number" min={0} max={9} value={scoreA} onChange={(e) => setScoreA(parseInt(e.target.value, 10) || 0)} className={touchInput} />
                            <span className="text-gray-500">–</span>
                            <input type="number" min={0} max={9} value={scoreB} onChange={(e) => setScoreB(parseInt(e.target.value, 10) || 0)} className={touchInput} />
                            <span className="text-white font-medium truncate">{m.playerBName}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-500">–</span>
                            <span className="text-white font-medium truncate">{m.playerBName}</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[var(--color-cream-dim)]" title="Odds: Player A / Draw / Player B (based on league form)">
                          {odds.oddsPlayerA.toFixed(2)} / {odds.oddsDraw.toFixed(2)} / {odds.oddsPlayerB.toFixed(2)}
                        </span>
                        {editingId === m.id ? (
                          <>
                            <button type="button" onClick={() => submitResult(m.id)} disabled={saving} className={`${touchBtn} btn-primary disabled:opacity-50`}>Save</button>
                            <button type="button" onClick={closeEdit} className={`${touchBtn} border border-[var(--color-border)] text-gray-400 hover:text-white`}>Cancel</button>
                          </>
                        ) : (
                          <button type="button" onClick={() => openEdit(m)} className={`${touchBtn} border border-[var(--color-accent-green)] text-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)] hover:text-[var(--color-surface)]`}>Enter result</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {completedByWeek.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--color-muted)]">Completed</h3>
          {completedByWeek.map(({ key, label, list: weekList }) => (
            <div key={key} className="card-felt overflow-hidden">
              <h4 className="px-3 sm:px-4 py-2 text-sm text-[var(--color-gold)] bg-[var(--color-surface-elevated)]">{label}</h4>
              <div className="divide-y divide-[var(--color-border)]">
                {weekList.map((m) => (
                  <div key={m.id} className="px-3 sm:px-4 py-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      <span className="text-white font-medium truncate">{m.playerAName}</span>
                      {editingId === m.id ? (
                        <>
                          <input type="number" min={0} max={9} value={scoreA} onChange={(e) => setScoreA(parseInt(e.target.value, 10) || 0)} className={touchInput} />
                          <span className="text-gray-500">–</span>
                          <input type="number" min={0} max={9} value={scoreB} onChange={(e) => setScoreB(parseInt(e.target.value, 10) || 0)} className={touchInput} />
                          <span className="text-white font-medium truncate">{m.playerBName}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[var(--color-accent-green)] font-medium">{m.playerAScore} – {m.playerBScore}</span>
                          <span className="text-white font-medium truncate">{m.playerBName}</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editingId === m.id ? (
                        <>
                          <button type="button" onClick={() => submitResult(m.id)} disabled={saving} className={`${touchBtn} btn-primary disabled:opacity-50`}>Update</button>
                          <button type="button" onClick={closeEdit} className={`${touchBtn} border border-[var(--color-border)] text-gray-400 hover:text-white`}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => openEdit(m)} className={`${touchBtn} border border-[var(--color-border)] text-gray-400 hover:text-white`}>Edit</button>
                          <button type="button" onClick={() => deleteResult(m.id)} className={`${touchBtn} text-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/10`}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {list.length === 0 && (
        <div className="card-felt p-6 sm:p-8 text-center text-[var(--color-cream-dim)]">
          No fixtures. Generate fixtures first.
        </div>
      )}
    </div>
  );
}
