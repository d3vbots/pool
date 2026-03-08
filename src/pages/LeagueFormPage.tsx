import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leagues } from '../api/client';
import type { CreateLeagueRequest, LeagueResponse } from '../api/client';

const STATUS_OPTIONS = ['Draft', 'RegistrationOpen', 'Active', 'Completed', 'Archived'];

export function LeagueFormPage() {
  const { id } = useParams();
  const isEdit = id != null;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateLeagueRequest>({
    name: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    minPlayers: 4,
    maxPlayers: 8,
    registrationFee: 0,
    matchFormatBestOf: 4,
    isDoubleRoundRobin: false,
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
  });
  const [status, setStatus] = useState('Draft');
  const [canEditSettings, setCanEditSettings] = useState(true);

  useEffect(() => {
    if (!isEdit) return;
    leagues.get(Number(id))
      .then((l: LeagueResponse) => {
        setForm({
          name: l.name,
          description: l.description ?? '',
          startDate: l.startDate.slice(0, 10),
          endDate: l.endDate.slice(0, 10),
          minPlayers: l.minPlayers,
          maxPlayers: l.maxPlayers,
          registrationFee: l.registrationFee,
          matchFormatBestOf: l.matchFormatBestOf,
          isDoubleRoundRobin: l.isDoubleRoundRobin,
          winPoints: l.winPoints,
          drawPoints: l.drawPoints,
          lossPoints: l.lossPoints,
        });
        setStatus(l.status);
        setCanEditSettings(!l.fixturesGenerated);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await leagues.update(Number(id), form);
        await leagues.setStatus(Number(id), status);
      } else {
        const created = await leagues.create(form);
        navigate(`/leagues/${created.id}`);
        return;
      }
      navigate(`/leagues/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const update = (patch: Partial<CreateLeagueRequest>) => setForm((f) => ({ ...f, ...patch }));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl sm:text-3xl text-[var(--color-cream)] tracking-wide mb-6">
        {isEdit ? 'Edit League' : 'New League'}
      </h1>
      <form onSubmit={handleSubmit} className="card-felt space-y-6 p-4 sm:p-6">
        {error && (
          <p className="text-sm text-[var(--color-accent-red)]">{error}</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              required
              readOnly={!canEditSettings}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => update({ description: e.target.value })}
              className="w-full min-h-[44px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none resize-none"
              rows={2}
              readOnly={!canEditSettings}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Start date *</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
              className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              readOnly={!canEditSettings}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">End date *</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => update({ endDate: e.target.value })}
              className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              readOnly={!canEditSettings}
            />
          </div>
          {form.startDate && form.endDate && new Date(form.endDate) > new Date(form.startDate) && (
            <p className="sm:col-span-2 text-sm text-[var(--color-gold)]">
              {(() => {
                const days = (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (24 * 60 * 60 * 1000);
                const weeks = Math.max(1, Math.floor(days / 7));
                return `League span: ${weeks} week${weeks === 1 ? '' : 's'} — when you generate fixtures, they will be spread evenly across these weeks (e.g. so many games per week).`;
              })()}
            </p>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Min players *</label>
            <input
              type="number"
              min={2}
              value={form.minPlayers}
              onChange={(e) => update({ minPlayers: parseInt(e.target.value, 10) || 2 })}
              className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              readOnly={!canEditSettings}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max players *</label>
            <input
              type="number"
              min={2}
              value={form.maxPlayers}
              onChange={(e) => update({ maxPlayers: parseInt(e.target.value, 10) || 2 })}
              className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              readOnly={!canEditSettings}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Registration fee</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.registrationFee}
              onChange={(e) => update({ registrationFee: parseFloat(e.target.value) || 0 })}
              className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              readOnly={!canEditSettings}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Match format (best of)</label>
            <input
              type="number"
              min={1}
              value={form.matchFormatBestOf}
              onChange={(e) => update({ matchFormatBestOf: parseInt(e.target.value, 10) || 4 })}
              className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              readOnly={!canEditSettings}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="double"
              checked={form.isDoubleRoundRobin}
              onChange={(e) => update({ isDoubleRoundRobin: e.target.checked })}
              className="rounded border-[var(--color-border)] text-[var(--color-accent-green)] focus:ring-[var(--color-accent-green)]"
              disabled={!canEditSettings}
            />
            <label htmlFor="double" className="text-sm text-gray-300">Double round robin (home & away)</label>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Win points</label>
            <input
              type="number"
              min={0}
              value={form.winPoints}
              onChange={(e) => update({ winPoints: parseInt(e.target.value, 10) || 0 })}
              className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              readOnly={!canEditSettings}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Draw points</label>
            <input
              type="number"
              min={0}
              value={form.drawPoints}
              onChange={(e) => update({ drawPoints: parseInt(e.target.value, 10) || 0 })}
              className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              readOnly={!canEditSettings}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Loss points</label>
            <input
              type="number"
              min={0}
              value={form.lossPoints}
              onChange={(e) => update({ lossPoints: parseInt(e.target.value, 10) || 0 })}
              className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              readOnly={!canEditSettings}
            />
          </div>
          {isEdit && (
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-black/40 px-3 py-2.5 text-base text-white focus:border-[var(--color-accent-green)] focus:outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {!canEditSettings && (
          <p className="text-sm text-gray-500">League settings are locked after fixtures are generated.</p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-4 py-2.5 min-h-[44px] disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/leagues/${id}` : '/leagues')}
            className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[var(--color-cream-dim)] hover:bg-white/5 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
