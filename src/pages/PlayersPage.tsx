import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { players } from '../api/client';
import type { PlayerResponse } from '../api/client';

export function PlayersPage() {
  const [list, setList] = useState<PlayerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    players.list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await players.create({ name: name.trim(), phoneNumber: phone.trim() });
      setName('');
      setPhone('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (playerId: number, playerName: string) => {
    if (!confirm(`Remove "${playerName}" from the system? They will no longer appear in the players list or be available to add to new leagues. Existing league and match history is kept.`)) return;
    setError('');
    try {
      await players.remove(playerId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove player');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-gold)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl sm:text-3xl text-[var(--color-cream)] tracking-wide">Players</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary min-h-[44px] px-4 py-2.5 text-sm font-semibold"
        >
          {showForm ? 'Cancel' : 'New Player'}
        </button>
      </div>
      {error && <p className="text-sm text-[var(--color-accent-red)]">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="card-felt p-6 max-w-md space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-cream)]">Add player</h3>
          <div>
            <label className="block text-sm text-[var(--color-cream-dim)] mb-1 font-medium">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-2.5 text-[var(--color-cream)] placeholder-[var(--color-muted)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/30 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-cream-dim)] mb-1 font-medium">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-2.5 text-[var(--color-cream)] placeholder-[var(--color-muted)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/30 focus:outline-none"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary min-h-[44px] px-4 py-2.5 disabled:opacity-50">
            {saving ? 'Saving…' : 'Create'}
          </button>
        </form>
      )}

      <div className="card-felt overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-muted)] text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link
                    to={`/player/${p.id}`}
                    className="text-[var(--color-cream)] font-medium hover:text-[var(--color-gold)] transition underline underline-offset-2"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--color-cream-dim)]">{p.phoneNumber}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleRemove(p.id, p.name)}
                    className="text-sm text-[var(--color-accent-red)] hover:underline min-h-[44px]"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && !showForm && (
        <p className="text-center text-[var(--color-muted)]">No players. Add one to register them in leagues.</p>
      )}
    </div>
  );
}
