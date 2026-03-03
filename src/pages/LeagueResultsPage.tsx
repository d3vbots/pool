import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { matches } from '../api/client';
import type { MatchResponse } from '../api/client';

export function LeagueResultsPage() {
  const { id } = useParams();
  const leagueId = Number(id);
  const [list, setList] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!id) return;
    matches.listByLeague(leagueId)
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id, leagueId]);

  const pending = list.filter((m) => m.status === 'Pending');
  const completed = list.filter((m) => m.status === 'Completed');

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent-green)] border-t-transparent" />
      </div>
    );
  }

  const touchBtn = 'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg px-4 py-2.5 text-base font-medium';
  const touchInput = 'w-14 h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-2 text-center text-[var(--color-cream)] text-lg focus:border-[var(--color-gold)] focus:outline-none';

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] tracking-wide">Enter results</h2>
      {error && <p className="text-sm text-[var(--color-accent-red)]">{error}</p>}

      {pending.length > 0 && (
        <div className="card-felt overflow-hidden">
          <h3 className="px-3 sm:px-4 py-2 text-sm text-[var(--color-muted)] bg-[var(--color-surface-elevated)]">Pending</h3>
          <div className="divide-y divide-[var(--color-border)]">
            {pending.map((m) => (
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
                <div className="flex flex-wrap gap-2">
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
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div className="card-felt overflow-hidden">
          <h3 className="px-3 sm:px-4 py-2 text-sm text-[var(--color-muted)] bg-[var(--color-surface-elevated)]">Completed</h3>
          <div className="divide-y divide-[var(--color-border)]">
            {completed.map((m) => (
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
      )}

      {list.length === 0 && (
        <div className="card-felt p-6 sm:p-8 text-center text-[var(--color-cream-dim)]">
          No fixtures. Generate fixtures first.
        </div>
      )}
    </div>
  );
}
