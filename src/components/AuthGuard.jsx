import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider.jsx';

// Guards a route for any signed-in user (not admin-only).
export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
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
  return children;
}
