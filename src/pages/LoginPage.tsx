import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore';
import { LOGO_PATH, POOL_IMAGES } from '../lib/poolImages';

export function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const isAuth = useAuthStore(selectIsAuthenticated);
  const navigate = useNavigate();

  if (isAuth) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-3 py-8 relative">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${POOL_IMAGES.hero})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-surface)] via-[var(--color-surface)]/95 to-[var(--color-surface)]" />
      <div className="relative w-full max-w-sm">
        <div className="card-felt p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={LOGO_PATH} alt="" className="h-12 w-auto max-w-[140px] object-contain" />
            <span className="font-display text-2xl text-[var(--color-cream)] tracking-wide">Pool League</span>
          </div>
          <h1 className="text-center font-display text-2xl sm:text-3xl text-[var(--color-gold)] mb-2 tracking-wide">
            Admin Login
          </h1>
          <p className="text-center text-[var(--color-cream-dim)] text-sm mb-6">Sign in to manage leagues & results</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--color-cream-dim)] mb-1 font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-3 text-base text-[var(--color-cream)] placeholder-[var(--color-muted)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/30 focus:outline-none transition"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--color-cream-dim)] mb-1 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[48px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-3 text-base text-[var(--color-cream)] placeholder-[var(--color-muted)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/30 focus:outline-none transition"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-[var(--color-accent-red)]">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full min-h-[48px] py-3 text-base disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
            Demo: admin / admin
          </p>
        </div>
      </div>
    </div>
  );
}
