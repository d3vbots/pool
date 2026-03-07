import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leagues } from '../api/client';
import { HeroPool } from '../components/HeroPool';
import { POOL_IMAGES } from '../lib/poolImages';
import type { LeagueResponse } from '../api/client';

export function DashboardPage() {
  const [leaguesList, setLeaguesList] = useState<LeagueResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    leagues.list()
      .then(setLeaguesList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activeLeagues = leaguesList.filter(
    (l) => l.status === 'Active' || l.status === 'RegistrationOpen'
  );

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
    <div className="space-y-6 sm:space-y-8">
      <HeroPool
        title="Pool League"
        subtitle="Track leagues, fixtures & standings. Where the best shots win."
        imageUrl={POOL_IMAGES.hero}
      />

      {activeLeagues.length === 0 ? (
        <div className="card-felt p-6 sm:p-8 text-center">
          <p className="text-[var(--color-cream-dim)] text-base sm:text-lg mb-4">No Active League.</p>
          <p className="text-[var(--color-muted)] mb-6">Create a new league and get the balls rolling.</p>
          <Link
            to="/leagues/new"
            className="btn-primary inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-base"
          >
            Create New League
          </Link>
        </div>
      ) : (
        <>
          <section>
            <h2 className="font-display text-2xl sm:text-3xl text-[var(--color-cream)] mb-4 tracking-wide">Active Leagues</h2>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeLeagues.map((league) => (
                <Link
                  key={league.id}
                  to={`/leagues/${league.id}`}
                  className="card-felt block p-4 sm:p-5 transition min-h-[44px] active:opacity-90"
                >
                  <h3 className="font-semibold text-[var(--color-cream)]">{league.name}</h3>
                  <p className="mt-1 text-sm text-[var(--color-cream-dim)]">
                    {league.playerCount} / {league.maxPlayers} players · <span className="text-[var(--color-gold)]">{league.status}</span>
                  </p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {new Date(league.startDate).toLocaleDateString()} – {new Date(league.endDate).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-display text-2xl sm:text-3xl text-[var(--color-cream)] mb-4 tracking-wide">All Leagues</h2>
            <div className="card-felt overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-muted)] text-sm">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Players</th>
                      <th className="px-4 py-3">Dates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {leaguesList.map((league) => (
                      <tr key={league.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3">
                          <Link to={`/leagues/${league.id}`} className="text-[var(--color-accent-green)] hover:text-[var(--color-gold)] font-medium transition">
                            {league.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-cream-dim)]">{league.status}</td>
                        <td className="px-4 py-3 text-[var(--color-cream-dim)]">{league.playerCount} / {league.maxPlayers}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)] text-sm">
                          {new Date(league.startDate).toLocaleDateString()} – {new Date(league.endDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
