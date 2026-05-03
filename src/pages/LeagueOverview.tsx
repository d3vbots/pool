import { Link } from 'react-router-dom';
import type { LeagueResponse } from '../api/client';

export function LeagueOverview({ league }: { league: LeagueResponse }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="card-felt p-5">
        <h3 className="text-sm text-[var(--color-muted)]">Players</h3>
        <p className="mt-1 text-2xl font-semibold text-[var(--color-cream)]">{league.playerCount} / {league.maxPlayers}</p>
        <Link to={`/leagues/${league.id}/players`} className="mt-2 text-sm text-[var(--color-accent-green)] hover:text-[var(--color-gold)] transition">
          Manage players →
        </Link>
      </div>
      <div className="card-felt p-5">
        <h3 className="text-sm text-[var(--color-muted)]">Fixtures</h3>
        <p className="mt-1 text-2xl font-semibold text-[var(--color-cream)]">
          {league.fixturesGenerated ? 'Generated' : 'Not generated'}
        </p>
        {league.fixturesGenerated && (
          <Link to={`/leagues/${league.id}/fixtures`} className="mt-2 text-sm text-[var(--color-accent-green)] hover:text-[var(--color-gold)] transition">
            View fixtures →
          </Link>
        )}
      </div>
      <div className="card-felt p-5">
        <h3 className="text-sm text-[var(--color-muted)]">Points</h3>
        <p className="mt-1 text-sm text-[var(--color-cream-dim)]">
          Win: {league.winPoints} · Draw: {league.drawPoints} · Loss: {league.lossPoints}
          {' · '}
          Apple bonus: {league.appleBonusPoints ?? 1}
        </p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Best of {league.matchFormatBestOf} · {league.isDoubleRoundRobin ? 'Double' : 'Single'} round robin</p>
      </div>
      <div className="card-felt p-5">
        <h3 className="text-sm text-[var(--color-muted)]">Dates</h3>
        <p className="mt-1 text-sm text-[var(--color-cream-dim)]">
          {new Date(league.startDate).toLocaleDateString()} – {new Date(league.endDate).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
