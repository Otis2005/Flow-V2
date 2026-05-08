import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider.jsx';

export default function AdminGuard({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main style={{ padding: '120px 0', textAlign: 'center' }}>
        <div className="tf-eyebrow">Checking session…</div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    return (
      <main className="tf-container" style={{ padding: '120px 0', maxWidth: 640 }}>
        <div className="tf-eyebrow tf-eyebrow-rule">Access denied</div>
        <h1 className="tf-section-title" style={{ marginTop: 12 }}>This area is admin-only.</h1>
        <p className="tf-section-sub">
          You're signed in as <strong>{user.email}</strong>, but this email is not on the admin allowlist.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <a className="tf-cta" href="/">Back to home</a>
        </div>
      </main>
    );
  }

  return children;
}
