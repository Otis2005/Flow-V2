import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import RightPanel from './RightPanel.jsx';
import { useAuth } from '../lib/AuthProvider.jsx';

// Public navigation. Admin link is intentionally NOT here, admins reach
// /admin via the right panel or by typing the URL.
const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/tenders', label: 'Browse Tenders' },
  { to: '/consultants', label: 'Consultants' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/about', label: 'About' }
];

// Hysteresis thresholds: only flip the "scrolled" class once we are clearly
// past 60px, and only flip it back once we are clearly above 20px. Without
// the gap, scrolling slowly across the threshold causes the header to
// toggle rapidly = the "shake" the user reported.
const SCROLL_ENTER = 60;
const SCROLL_LEAVE = 20;

export default function Header({ logoVariant = 'bars' }) {
  const [scrolled, setScrolled] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const rafRef = useRef(null);
  const scrolledRef = useRef(false); // mirrors `scrolled` for use inside rAF without re-binding

  // Close the right panel on route change.
  useEffect(() => { setPanelOpen(false); }, [location.pathname]);

  // Throttled scroll handler with hysteresis. rAF ensures we only update
  // state at most once per paint, killing the per-pixel jitter.
  useEffect(() => {
    function tick() {
      rafRef.current = null;
      const y = window.scrollY;
      if (!scrolledRef.current && y > SCROLL_ENTER) {
        scrolledRef.current = true;
        setScrolled(true);
      } else if (scrolledRef.current && y < SCROLL_LEAVE) {
        scrolledRef.current = false;
        setScrolled(false);
      }
    }
    function onScroll() {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(tick);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
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
            {!user && (
              <button className="tf-cta tf-hide-sm" onClick={() => navigate('/sign-up')}>
                Sign up
              </button>
            )}
            <button
              type="button"
              className={'tf-burger tf-burger-fixed' + (panelOpen ? ' is-open' : '')}
              onClick={() => setPanelOpen(true)}
              aria-label="Open menu"
              aria-expanded={panelOpen}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>
      <RightPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
