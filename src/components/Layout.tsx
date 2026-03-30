import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore';
import { LOGO_PATH } from '../lib/poolImages';

export function Layout() {
  const isAuth = useAuthStore(selectIsAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  const navLinkClass = (path: string) =>
    `min-h-[44px] min-w-[44px] flex items-center justify-center px-3 rounded-lg font-medium transition ${
      isActive(path)
        ? 'text-[var(--color-felt-bright)] bg-[var(--color-felt)]/12 border border-[var(--color-border)]'
        : 'text-[var(--color-surface)]/88 hover:text-[var(--color-felt)] hover:bg-[var(--color-felt)]/10'
    }`;
  const mobileNavLinkClass = (path: string) =>
    `min-h-[48px] flex items-center px-3 rounded-lg font-medium transition ${
      isActive(path)
        ? 'text-[var(--color-felt-bright)] bg-[var(--color-felt)]/12'
        : 'text-[var(--color-surface)]/88 hover:bg-[var(--color-felt)]/10 hover:text-[var(--color-felt)]'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <header className="app-header border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="shrink-0 min-h-[44px] flex items-center gap-3 sm:gap-4 group"
            onClick={closeMenu}
          >
            <img
              src={LOGO_PATH}
              alt=""
              className="h-14 sm:h-[4.5rem] w-auto max-w-[min(70vw,300px)] sm:max-w-[340px] object-contain object-left shrink-0 drop-shadow-[0_2px_8px_rgba(7,16,12,0.12)]"
            />
            <span className="font-display text-2xl sm:text-3xl tracking-wide text-[var(--color-surface)] group-hover:text-[var(--color-felt)] transition">
              Pool League
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/standings" className={navLinkClass('/standings')}>Standings</Link>
            {isAuth && (
              <>
                <Link to="/" className={navLinkClass('/')}>Dashboard</Link>
                <Link to="/leagues" className={navLinkClass('/leagues')}>Leagues</Link>
                <Link to="/players" className={navLinkClass('/players')}>Players</Link>
                <button type="button" onClick={handleLogout} className="min-h-[44px] min-w-[44px] flex items-center justify-center px-3 rounded-lg font-medium text-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/10 transition">
                  Logout
                </button>
              </>
            )}
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--color-surface)] hover:bg-[var(--color-felt)]/10"
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
          <div className="md:hidden border-t border-[var(--color-border)]/70 bg-[var(--color-signage)]">
            <nav className="flex flex-col py-2 px-3 max-w-6xl mx-auto">
              <Link to="/standings" className={mobileNavLinkClass('/standings')} onClick={closeMenu}>Standings</Link>
              {isAuth && (
                <>
                  <Link to="/" className={mobileNavLinkClass('/')} onClick={closeMenu}>Dashboard</Link>
                  <Link to="/leagues" className={mobileNavLinkClass('/leagues')} onClick={closeMenu}>Leagues</Link>
                  <Link to="/players" className={mobileNavLinkClass('/players')} onClick={closeMenu}>Players</Link>
                  <button type="button" onClick={handleLogout} className="min-h-[48px] flex items-center px-3 rounded-lg font-medium text-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/10 transition">
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-safe min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
