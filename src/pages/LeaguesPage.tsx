import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leagues } from '../api/client';
import { HeroPool } from '../components/HeroPool';
import { POOL_IMAGES } from '../lib/poolImages';
import type { LeagueResponse } from '../api/client';

export function LeaguesPage() {
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
    <div className="space-y-6">
      <HeroPool title="Leagues" subtitle="Create and manage your pool leagues." imageUrl={POOL_IMAGES.hero} compact />
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl text-[var(--color-cream)] tracking-wide sr-only">All leagues</h2>
        <Link to="/leagues/new" className="btn-primary inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm font-semibold">
          New League
        </Link>
      </div>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((league) => (
          <Link
            key={league.id}
            to={`/leagues/${league.id}`}
            className="card-felt block p-4 sm:p-5 transition active:opacity-90"
          >
            <h3 className="font-semibold text-[var(--color-cream)]">{league.name}</h3>
            {league.description && (
              <p className="mt-1 text-sm text-[var(--color-cream-dim)] line-clamp-2">{league.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded bg-[var(--color-felt)] px-2 py-0.5 text-xs text-[var(--color-gold)]">{league.status}</span>
              <span className="text-xs text-[var(--color-muted)]">{league.playerCount}/{league.maxPlayers} players</span>
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              {new Date(league.startDate).toLocaleDateString()} – {new Date(league.endDate).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
      {list.length === 0 && (
        <div className="card-felt p-8 text-center text-[var(--color-cream-dim)]">
          No leagues yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
