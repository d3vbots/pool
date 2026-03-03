import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { matches } from '../api/client';
import type { MatchResponse } from '../api/client';

export function LeagueFixturesPage() {
  const { id } = useParams();
  const leagueId = Number(id);
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

  const byLeg = list.reduce<Record<number, MatchResponse[]>>((acc, m) => {
    (acc[m.leg] = acc[m.leg] ?? []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl sm:text-2xl text-[var(--color-cream)] tracking-wide">Fixtures</h2>
      <div className="space-y-6">
        {Object.entries(byLeg).sort(([a], [b]) => Number(a) - Number(b)).map(([leg, matchesList]) => (
          <div key={leg}>
            <h3 className="text-sm text-[var(--color-gold)] mb-2 font-medium">Leg {leg}</h3>
            <div className="card-felt overflow-hidden">
              <table className="w-full text-left">
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
        ))}
      </div>
    </div>
  );
}
