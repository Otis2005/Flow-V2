import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider.jsx';

// Slide-in panel from the right, triggered by the hamburger icon in the
// header. Holds user-action links: dashboard, admin (when applicable),
// consultant area, account actions. Main horizontal nav stays in the
// header for primary site navigation.
export default function RightPanel({ open, onClose }) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Lock body scroll while open so the page underneath doesn't drift.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  function go(path) {
    onClose();
    navigate(path);
  }

  return (
    <>
      <div
        className={'tf-rpanel-scrim' + (open ? ' is-open' : '')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={'tf-rpanel' + (open ? ' is-open' : '')}
        role="dialog"
        aria-label="Menu"
        aria-hidden={!open}
      >
        <div className="tf-rpanel-head">
          {user ? (
            <>
              <div className="tf-rpanel-avatar">
                {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
              </div>
              <div className="tf-rpanel-userblock">
                <div className="tf-rpanel-name">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </div>
                <div className="tf-rpanel-email">{user.email}</div>
                {isAdmin && <span className="tf-rpanel-pill">Admin</span>}
              </div>
            </>
          ) : (
            <>
              <div className="tf-rpanel-userblock">
                <div className="tf-rpanel-eyebrow">Welcome</div>
                <div className="tf-rpanel-name">Sign in to TenderFlow</div>
                <div className="tf-rpanel-email">
                  Track tenders, hire consultants, and download checklists.
                </div>
              </div>
            </>
          )}
          <button
            className="tf-rpanel-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {!user && (
          <div className="tf-rpanel-cta-row">
            <button className="tf-cta" onClick={() => go('/sign-up')}>Sign up</button>
            <button className="tf-cta-ghost" onClick={() => go('/sign-in')}>Sign in</button>
          </div>
        )}

        <nav className="tf-rpanel-nav">
          {user && (
            <>
              <button className="tf-rpanel-item" onClick={() => go('/dashboard')}>
                <span>Your dashboard</span>
                <span className="tf-rpanel-item-meta">Watchlist, consultations</span>
              </button>
              {isAdmin && (
                <button className="tf-rpanel-item" onClick={() => go('/admin')}>
                  <span>Admin</span>
                  <span className="tf-rpanel-item-meta">Tenders, consultants</span>
                </button>
              )}
              <button className="tf-rpanel-item" onClick={() => go('/consultant-dashboard')}>
                <span>Consultant area</span>
                <span className="tf-rpanel-item-meta">Profile, hire requests</span>
              </button>
            </>
          )}

          <div className="tf-rpanel-divider" />

          <button className="tf-rpanel-item" onClick={() => go('/tenders')}>Browse tenders</button>
          <button className="tf-rpanel-item" onClick={() => go('/consultants')}>Find a consultant</button>
          <button className="tf-rpanel-item" onClick={() => go('/consultant-signup')}>Become a consultant</button>
          <button className="tf-rpanel-item" onClick={() => go('/how-it-works')}>How it works</button>
          <button className="tf-rpanel-item" onClick={() => go('/about')}>About</button>

          <div className="tf-rpanel-divider" />

          <button className="tf-rpanel-item-sm" onClick={() => go('/contact')}>Contact</button>
          <button className="tf-rpanel-item-sm" onClick={() => go('/faq')}>FAQ</button>
          <button className="tf-rpanel-item-sm" onClick={() => go('/privacy')}>Privacy</button>
          <button className="tf-rpanel-item-sm" onClick={() => go('/terms')}>Terms</button>

          {user && (
            <>
              <div className="tf-rpanel-divider" />
              <button
                className="tf-rpanel-item-sm"
                onClick={async () => {
                  onClose();
                  await signOut();
                  navigate('/');
                }}
                style={{ color: 'var(--danger)' }}
              >
                Sign out
              </button>
            </>
          )}
        </nav>

        <div className="tf-rpanel-foot">
          <span className="tf-logo-text" style={{ fontSize: 18 }}>Tender<em>Flow</em></span>
          <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 4 }}>
            Pan-African opportunity intelligence
          </span>
        </div>
      </aside>
    </>
  );
}
