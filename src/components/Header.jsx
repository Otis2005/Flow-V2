import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../lib/AuthProvider.jsx';

// Public navigation. Admin link is intentionally NOT here. Admins go to
// /admin directly; the route still exists and is gated server-side.
const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/tenders', label: 'Browse Tenders' },
  { to: '/consultants', label: 'Consultants' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/about', label: 'About' }
];

export default function Header({ logoVariant = 'bars' }) {
  const [mobOpen, setMobOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => { setMobOpen(false); }, [location.pathname]);

  // Add a shadow / tighter padding once the user has scrolled past the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={'tf-header tf-header-sticky' + (scrolled ? ' is-scrolled' : '')}>
      <div className="tf-container tf-header-row">
        <Logo variant={logoVariant} onClick={() => navigate('/')} />
        <nav className="tf-nav">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="tf-header-cta">
          {user ? (
            <>
              {isAdmin && (
                <button className="tf-cta-ghost tf-hide-sm" onClick={() => navigate('/admin')}>
                  Admin
                </button>
              )}
              <button className="tf-cta-ghost tf-hide-sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </button>
              <button className="tf-cta" onClick={async () => { await signOut(); navigate('/'); }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <button className="tf-cta-ghost tf-hide-sm" onClick={() => navigate('/sign-in')}>
                Sign in
              </button>
              <button className="tf-cta" onClick={() => navigate('/sign-up')}>
                Sign up
              </button>
            </>
          )}
        </div>
        <button
          className={'tf-burger' + (mobOpen ? ' is-open' : '')}
          aria-label="Menu"
          onClick={() => setMobOpen(o => !o)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
      {mobOpen && (
        <div className="tf-mobnav">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="tf-mobnav-actions">
            {user ? (
              <>
                <button className="tf-cta-ghost" onClick={() => navigate('/dashboard')}>Dashboard</button>
                <button className="tf-cta" onClick={async () => { await signOut(); navigate('/'); }}>Sign out</button>
              </>
            ) : (
              <>
                <button className="tf-cta-ghost" onClick={() => navigate('/sign-in')}>Sign in</button>
                <button className="tf-cta" onClick={() => navigate('/sign-up')}>Sign up</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
