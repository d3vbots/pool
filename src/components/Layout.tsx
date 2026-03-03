import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore';

export function Layout() {
  const isAuth = useAuthStore(selectIsAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  const navLinkClass = "min-h-[44px] min-w-[44px] flex items-center justify-center px-3 rounded-lg text-[var(--color-cream-dim)] hover:text-[var(--color-gold)] hover:bg-white/5 transition font-medium";
  const mobileNavLinkClass = "min-h-[48px] flex items-center px-3 rounded-lg text-[var(--color-cream-dim)] hover:bg-white/5 hover:text-[var(--color-gold)] transition font-medium";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/95 backdrop-blur-sm sticky top-0 z-20 shadow-lg shadow-black/20">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="shrink-0 min-h-[44px] flex items-center gap-3 group"
            onClick={closeMenu}
          >
            <img src="/logo.png" alt="" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl sm:text-2xl tracking-wide text-[var(--color-cream)] group-hover:text-[var(--color-gold)] transition">
              Imbizo Pool League
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/standings" className={navLinkClass}>Standings</Link>
            {isAuth && (
              <>
                <Link to="/" className={navLinkClass}>Dashboard</Link>
                <Link to="/leagues" className={navLinkClass}>Leagues</Link>
                <Link to="/players" className={navLinkClass}>Players</Link>
                <button type="button" onClick={handleLogout} className={`${navLinkClass} text-[var(--color-accent-red)] hover:text-[var(--color-accent-red)]`}>
                  Logout
                </button>
              </>
            )}
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--color-cream)] hover:bg-white/5"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
            <nav className="flex flex-col py-2 px-3 max-w-6xl mx-auto">
              <Link to="/standings" className={mobileNavLinkClass} onClick={closeMenu}>Standings</Link>
              {isAuth && (
                <>
                  <Link to="/" className={mobileNavLinkClass} onClick={closeMenu}>Dashboard</Link>
                  <Link to="/leagues" className={mobileNavLinkClass} onClick={closeMenu}>Leagues</Link>
                  <Link to="/players" className={mobileNavLinkClass} onClick={closeMenu}>Players</Link>
                  <button type="button" onClick={handleLogout} className={`${mobileNavLinkClass} text-[var(--color-accent-red)]`}>
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
