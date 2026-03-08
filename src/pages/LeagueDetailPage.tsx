import { useEffect, useState } from 'react';
import { Link, Outlet, useParams, useNavigate } from 'react-router-dom';
import { leagues } from '../api/client';
import type { LeagueResponse } from '../api/client';

export function LeagueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [league, setLeague] = useState<LeagueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingHidden, setTogglingHidden] = useState(false);

  const leagueId = Number(id);
  const base = `/leagues/${id}`;

  useEffect(() => {
    if (!id) return;
    leagues.get(leagueId)
      .then(setLeague)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, leagueId]);

  const handleGenerateFixtures = async () => {
    if (!league) return;
    setGenerating(true);
    setError('');
    try {
      await leagues.generateFixtures(leagueId);
      const updated = await leagues.get(leagueId);
      setLeague(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate fixtures');
    } finally {
      setGenerating(false);
    }
  };

  const handleSetStatus = async (newStatus: string) => {
    setError('');
    try {
      await leagues.setStatus(leagueId, newStatus);
      const updated = await leagues.get(leagueId);
      setLeague(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  const handleSetHidden = async (isHidden: boolean) => {
    setError('');
    setTogglingHidden(true);
    try {
      await leagues.setHidden(leagueId, isHidden);
      const updated = await leagues.get(leagueId);
      setLeague(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update visibility');
    } finally {
      setTogglingHidden(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this league? It will be hidden from all lists. You can restore it later from the API.')) return;
    setError('');
    setDeleting(true);
    try {
      await leagues.delete(leagueId);
      navigate('/leagues');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete league');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (error && !league) {
    return (
      <div className="rounded-lg border border-[var(--color-accent-red)] bg-red-950/20 p-4 text-[var(--color-accent-red)]">
        {error}
      </div>
    );
  }

  if (!league) return null;

  const canGenerate = league.status === 'RegistrationOpen' && !league.fixturesGenerated && league.playerCount >= league.minPlayers;
  const canOpenRegistration = league.status === 'Draft' && !league.fixturesGenerated;
  const needsMorePlayers = league.status === 'RegistrationOpen' && !league.fixturesGenerated && league.playerCount < league.minPlayers;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <Link to="/leagues" className="min-h-[44px] flex items-center text-[var(--color-cream-dim)] hover:text-[var(--color-gold)] transition w-fit">← Leagues</Link>
        <h1 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] break-words tracking-wide">{league.name}</h1>
        <span className="rounded bg-[var(--color-felt)] px-2 py-1 text-sm text-[var(--color-gold)] w-fit">{league.status}</span>
        {canOpenRegistration && (
          <button
            type="button"
            onClick={() => handleSetStatus('RegistrationOpen')}
            className="btn-primary min-h-[44px] px-4 py-2.5 text-base w-full sm:w-auto"
          >
            Open registration
          </button>
        )}
        {canGenerate && (
          <button
            type="button"
            onClick={handleGenerateFixtures}
            disabled={generating}
            className="btn-primary min-h-[44px] px-4 py-2.5 text-base w-full sm:w-auto disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate Fixtures'}
          </button>
        )}
      </div>
      {needsMorePlayers && (
        <p className="text-sm text-[var(--color-gold)]">
          Add at least {league.minPlayers} players to this league (currently {league.playerCount}), then you can generate fixtures.
        </p>
      )}
      {error && (
        <p className="text-sm text-[var(--color-accent-red)]">{error}</p>
      )}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-2 border-t border-[var(--color-border)]">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-cream-dim)] min-h-[44px]">
          <input
            type="checkbox"
            checked={!!league.isHidden}
            onChange={(e) => handleSetHidden(e.target.checked)}
            disabled={togglingHidden}
            className="rounded border-[var(--color-border)] text-[var(--color-accent-green)] focus:ring-[var(--color-accent-green)] w-5 h-5 shrink-0"
          />
          <span>Hidden from public standings</span>
        </label>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--color-accent-red)]/50 text-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/10 disabled:opacity-50 transition"
        >
          {deleting ? 'Deleting…' : 'Delete league'}
        </button>
      </div>
      {league.description && (
        <p className="text-[var(--color-cream-dim)] text-sm sm:text-base">{league.description}</p>
      )}
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-2 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
        <Link to={base} className="min-h-[44px] shrink-0 flex items-center px-3 py-2.5 rounded-lg text-[var(--color-cream-dim)] hover:bg-white/5 hover:text-[var(--color-gold)] transition whitespace-nowrap">
          Overview
        </Link>
        <Link to={`${base}/players`} className="min-h-[44px] shrink-0 flex items-center px-3 py-2.5 rounded-lg text-[var(--color-cream-dim)] hover:bg-white/5 hover:text-[var(--color-gold)] transition whitespace-nowrap">Players ({league.playerCount})</Link>
        <Link to={`${base}/fixtures`} className="min-h-[44px] shrink-0 flex items-center px-3 py-2.5 rounded-lg text-[var(--color-cream-dim)] hover:bg-white/5 hover:text-[var(--color-gold)] transition whitespace-nowrap">Fixtures</Link>
        <Link to={`${base}/results`} className="min-h-[44px] shrink-0 flex items-center px-3 py-2.5 rounded-lg text-[var(--color-cream-dim)] hover:bg-white/5 hover:text-[var(--color-gold)] transition whitespace-nowrap">Results</Link>
        <Link to={`${base}/leaderboard`} className="min-h-[44px] shrink-0 flex items-center px-3 py-2.5 rounded-lg text-[var(--color-cream-dim)] hover:bg-white/5 hover:text-[var(--color-gold)] transition whitespace-nowrap">Leaderboard</Link>
      </div>
      <Outlet context={{ league, setLeague }} />
    </div>
  );
}
