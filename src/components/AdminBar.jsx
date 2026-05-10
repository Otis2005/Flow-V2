import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider.jsx';

const TABS = [
  { to: '/admin', label: 'Tenders' },
  { to: '/admin/upload', label: 'Upload' },
  { to: '/admin/consultants', label: 'Consultants' }
];

export default function AdminBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="tf-admin-bar">
      <div className="tf-container tf-admin-bar-row" style={{ alignItems: 'center', display: 'flex' }}>
        <span className="tf-eyebrow">Internal · Admin</span>
        <span style={{ flex: 1 }} />
        {TABS.map(t => {
          const active = t.to === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              style={{
                color: 'var(--paper)',
                opacity: active ? 1 : 0.7,
                fontSize: 13,
                marginRight: 22,
                textDecoration: 'none'
              }}
            >
              {t.label}
            </Link>
          );
        })}
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, marginRight: 16 }}>
          <strong style={{ color: 'var(--paper)' }}>{user?.email}</strong>
        </span>
        <button
          className="tf-cta-ghost"
          onClick={async () => { await signOut(); navigate('/'); }}
          style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'var(--paper)' }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
