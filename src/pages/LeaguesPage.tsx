import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leagues } from '../api/client';
import { HeroPool } from '../components/HeroPool';
import { POOL_IMAGES } from '../lib/poolImages';
import type { LeagueResponse } from '../api/client';

const SEARCH_DEBOUNCE_MS = 300;

export function LeaguesPage() {
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
    leagues.list({ q: searchQuery || undefined })
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
    <div className="space-y-6">
      <HeroPool title="Leagues" subtitle="Create and manage your pool leagues." imageUrl={POOL_IMAGES.hero} compact />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label htmlFor="league-search" className="sr-only">Search leagues</label>
          <input
            id="league-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or description…"
            className="w-full min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-2.5 text-[var(--color-cream)] placeholder-[var(--color-muted)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/30 focus:outline-none"
          />
        </div>
        <Link to="/leagues/new" className="btn-primary inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm font-semibold shrink-0">
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
          {searchQuery ? 'No leagues match your search.' : 'No leagues yet. Create one to get started.'}
        </div>
      )}
    </div>
  );
}
