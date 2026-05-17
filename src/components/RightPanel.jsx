import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider.jsx';

// Slide-in panel from the right, triggered by the hamburger icon in the
// header. Holds user-action links: dashboard, admin (when applicable),
// consultant area, account actions. Main horizontal nav stays in the
// header for primary site navigation.
//
// Visual treatment: navy header band with gold accents, animated item
// rows with leading icons, profile photo (or initials) beside the
// email when signed in. Slight transition stagger on items as the
// panel opens.
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

  // Avatar: prefer the Supabase user_metadata.avatar_url (set when
  // user signed up via Google / OAuth); fall back to the first letter
  // of their name or email rendered in a gold circle.
  const avatarUrl = user?.user_metadata?.avatar_url
    || user?.user_metadata?.picture
    || null;
  const initial = (user?.user_metadata?.full_name || user?.email || '?')[0]?.toUpperCase();

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
              <div
                className={'tf-rpanel-avatar' + (avatarUrl ? ' has-photo' : '')}
                style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
              >
                {!avatarUrl && initial}
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
              <PanelItem
                icon={IconDashboard}
                label="Your dashboard"
                meta="Watchlist, consultations"
                onClick={() => go('/dashboard')}
              />
              {isAdmin && (
                <PanelItem
                  icon={IconAdmin}
                  label="Admin"
                  meta="Tenders, consultants"
                  onClick={() => go('/admin')}
                  tone="gold"
                />
              )}
              <PanelItem
                icon={IconConsultant}
                label="Consultant area"
                meta="Profile, hire requests"
                onClick={() => go('/consultant-dashboard')}
              />
            </>
          )}

          <div className="tf-rpanel-divider" />

          <PanelItem icon={IconBrowse} label="Browse tenders" onClick={() => go('/tenders')} />
          <PanelItem icon={IconFindPro} label="Find a consultant" onClick={() => go('/consultants')} />
          <PanelItem icon={IconBriefcase} label="Become a consultant" onClick={() => go('/consultant-signup')} />
          <PanelItem icon={IconCompass} label="How it works" onClick={() => go('/how-it-works')} />
          <PanelItem icon={IconBuilding} label="About" onClick={() => go('/about')} />

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
            East African tender intelligence
          </span>
        </div>
      </aside>
    </>
  );
}

// Reusable menu item with leading icon, label, and optional sub-label.
function PanelItem({ icon: Icon, label, meta, onClick, tone }) {
  return (
    <button
      className={'tf-rpanel-item' + (tone ? ' is-tone-' + tone : '')}
      onClick={onClick}
    >
      <span className="tf-rpanel-item-icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="tf-rpanel-item-body">
        <span className="tf-rpanel-item-label">{label}</span>
        {meta && <span className="tf-rpanel-item-meta">{meta}</span>}
      </span>
      <span className="tf-rpanel-item-arrow" aria-hidden="true">→</span>
    </button>
  );
}

// ── Inline icon components ──────────────────────────────────────
// Outline glyphs at currentColor so they pick up the panel's text
// colour and respond to hover state transitions.

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M3 3h7v9H3V3zm11 0h7v5h-7V3zM3 14h7v7H3v-7zm11-3h7v10h-7V11z"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}
function IconAdmin() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconConsultant() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function IconBrowse() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2"
        fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7 9h10M7 13h10M7 17h6"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function IconFindPro() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M20 20l-4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function IconBriefcase() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2"
        fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M16 8l-2 6-6 2 2-6 6-2z"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M4 21h12M4 21H2m14 0V11h4v10h-4M4 21h12"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M7 8h2M7 12h2M7 16h2M11 8h2M11 12h2"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
