import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { players, leagues } from '../api/client';
import type { LeagueResponse } from '../api/client';
import type { PlayerResponse, LeaguePlayerResponse } from '../api/client';

type OutletContext = { league: LeagueResponse; setLeague: (l: LeagueResponse) => void };

export function LeaguePlayersPage() {
  const { id } = useParams();
  const { league, setLeague } = useOutletContext<OutletContext>();
  const leagueId = Number(id);
  const [leaguePlayers, setLeaguePlayers] = useState<LeaguePlayerResponse[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    if (!id) return;
    Promise.all([players.listByLeague(leagueId), players.list()])
      .then(([lp, ap]) => {
        setLeaguePlayers(lp);
        setAllPlayers(ap);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id, leagueId]);

  const inLeagueIds = new Set(leaguePlayers.map((lp) => lp.playerId));
  const available = allPlayers.filter((p) => !inLeagueIds.has(p.id));
  const canAdd = !league.fixturesGenerated && (league.status === 'Draft' || league.status === 'RegistrationOpen') && leaguePlayers.length < league.maxPlayers;

  const handleAdd = async (playerId: number) => {
    setError('');
    setAdding(true);
    try {
      await players.addToLeague(leagueId, playerId);
      const [lp, updated] = await Promise.all([players.listByLeague(leagueId), leagues.get(leagueId)]);
      setLeaguePlayers(lp);
      setLeague(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (playerId: number) => {
    if (!confirm('Remove this player from the league?')) return;
    setError('');
    try {
      await players.removeFromLeague(leagueId, playerId);
      const [lp, updated] = await Promise.all([players.listByLeague(leagueId), leagues.get(leagueId)]);
      setLeaguePlayers(lp);
      setLeague(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    }
  };

  const handlePaymentToggle = async (playerId: number, currentStatus: string) => {
    const next = currentStatus === 'Paid' ? 'NotPaid' : 'Paid';
    setError('');
    try {
      await players.updatePaymentStatus(leagueId, playerId, next);
      const lp = await players.listByLeague(leagueId);
      setLeaguePlayers(lp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update payment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] tracking-wide">Players ({leaguePlayers.length} / {league.maxPlayers})</h2>
      {error && <p className="text-sm text-[var(--color-accent-red)]">{error}</p>}

      <div className="card-felt overflow-hidden">
        <div className="table-scroll">
        <table className="w-full text-left min-w-[400px]">
          <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-muted)] text-sm">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">P</th>
              <th className="px-4 py-3">W-D-L</th>
              <th className="px-4 py-3 text-center" title="Green apples">🍏</th>
              <th className="px-4 py-3">Pts</th>
              {!league.fixturesGenerated && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {leaguePlayers.map((lp, i) => (
              <tr key={lp.playerId} className="hover:bg-white/5">
                <td className="px-4 py-3 text-[var(--color-gold)]">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link to={`/player/${lp.playerId}`} className="text-[var(--color-cream)] hover:text-[var(--color-gold)] transition underline underline-offset-2">
                    {lp.playerName}
                  </Link>
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handlePaymentToggle(lp.playerId, lp.paymentStatus)}
                    className={`min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg text-sm font-medium transition ${
                      lp.paymentStatus === 'Paid'
                        ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] border border-[var(--color-accent-green)]/50'
                        : 'bg-[var(--color-surface-elevated)] text-[var(--color-cream-dim)] border border-[var(--color-border)] hover:border-[var(--color-gold)]/50'
                    }`}
                  >
                    {lp.paymentStatus === 'Paid' ? 'Paid ✓' : 'Not paid'}
                  </button>
                </td>
                <td className="px-4 py-3 text-[var(--color-cream-dim)]">{lp.played}</td>
                <td className="px-4 py-3 text-[var(--color-cream-dim)]">{lp.wins}-{lp.draws}-{lp.losses}</td>
                <td className="px-4 py-3 text-center text-[var(--color-cream-dim)]">{lp.apples ?? 0}</td>
                <td className="px-4 py-3 font-medium text-[var(--color-accent-green)]">{lp.points}</td>
                {!league.fixturesGenerated && (
                  <td className="px-3 sm:px-4 py-3">
                    <button type="button" onClick={() => handleRemove(lp.playerId)} className="min-h-[44px] min-w-[44px] flex items-center text-sm text-[var(--color-accent-red)] hover:underline">
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {canAdd && (
        <div className="card-felt p-4">
          <h3 className="text-sm font-medium text-[var(--color-cream-dim)] mb-3">Add player</h3>
            {available.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">All registered players are in this league, or max reached.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.slice(0, 20).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAdd(p.id)}
                  disabled={adding}
                  className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-cream-dim)] hover:border-[var(--color-accent-green)] hover:text-[var(--color-cream)] disabled:opacity-50 transition"
                >
                  + {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
