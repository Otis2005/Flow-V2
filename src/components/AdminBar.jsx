import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider.jsx';

export default function AdminBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="tf-admin-bar">
      <div className="tf-container tf-admin-bar-row" style={{ alignItems: 'center', display: 'flex' }}>
        <span className="tf-eyebrow">Internal · Admin</span>
        <span style={{ flex: 1 }} />
        <Link
          to="/admin"
          style={{
            color: 'var(--paper)',
            opacity: location.pathname === '/admin' ? 1 : 0.7,
            fontSize: 13,
            marginRight: 18,
            textDecoration: 'none'
          }}
        >
          Dashboard
        </Link>
        <Link
          to="/admin/upload"
          style={{
            color: 'var(--paper)',
            opacity: location.pathname.startsWith('/admin/upload') ? 1 : 0.7,
            fontSize: 13,
            marginRight: 24,
            textDecoration: 'none'
          }}
        >
          Upload tender
        </Link>
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
