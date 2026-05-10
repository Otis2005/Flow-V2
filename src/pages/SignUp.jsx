import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider.jsx';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';

export default function SignUp() {
  const { signUpWithPassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from || '/dashboard';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdSession, setCreatedSession] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  if (user) return <Navigate to={returnTo} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setSubmitting(false);
      return;
    }
    const { error, data } = await signUpWithPassword(email, password, name);
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Supabase returns either an active session (if confirm-email is off)
    // or no session (if confirm-email is on).
    if (data?.session) {
      setCreatedSession(true);
      setTimeout(() => navigate(returnTo), 600);
    } else {
      setNeedsConfirm(true);
    }
  }

  return (
    <main className="tf-page-anim">
      <div className="tf-auth-shell">
        <div className="tf-auth-art">
          <div>
            <div className="tf-eyebrow tf-eyebrow-rule" style={{ color: 'rgba(245,246,235,0.6)' }}>Create your account</div>
            <h2>
              Win more tenders.<br />
              <em>Spend less time hunting.</em>
            </h2>
            <p>
              Save tenders to a watchlist, generate requirement checklists, and connect
              with vetted consultants who can prepare your bid for you.
            </p>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'rgba(245,246,235,0.85)', lineHeight: 2 }}>
            <li>· Free for bidders, always.</li>
            <li>· No credit card required.</li>
            <li>· One click to delete your account.</li>
          </ul>
        </div>
        <div className="tf-auth-form">
          <div className="tf-eyebrow tf-eyebrow-rule">Sign up</div>
          <h1 className="tf-section-title" style={{ marginTop: 12, fontSize: 36 }}>Create your account</h1>
          <p className="tf-section-sub" style={{ marginBottom: 28 }}>
            Already have one? <Link to="/sign-in" style={{ color: 'var(--navy)', borderBottom: '1px solid var(--gold)' }}>Sign in</Link>.
          </p>

          {!isSupabaseConfigured && (
            <div style={{ padding: 16, border: '1px dashed var(--rule)', background: 'var(--paper)', color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
              Sign-up is disabled until Supabase is configured.
            </div>
          )}

          {needsConfirm ? (
            <div style={{ padding: 24, background: 'var(--paper)', border: '1px solid var(--rule)' }}>
              <div className="tf-eyebrow" style={{ color: 'var(--gold)' }}>Almost there</div>
              <h3 style={{ fontFamily: 'var(--serif)', margin: '12px 0', fontSize: 22 }}>
                Check your inbox to verify your email.
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                We sent a confirmation link to <strong>{email}</strong>. Click it, then come
                back and sign in.
              </p>
              <button className="tf-cta" style={{ marginTop: 16 }} onClick={() => navigate('/sign-in')}>
                Go to sign in
              </button>
            </div>
          ) : createdSession ? (
            <div style={{ padding: 24, background: 'var(--paper)', border: '1px solid var(--rule)' }}>
              <div className="tf-eyebrow" style={{ color: 'var(--gold)' }}>You are in</div>
              <p>Redirecting to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="tf-ob-label">
                <span className="tf-ob-label-text">Full name</span>
                <input
                  className="tf-ob-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <label className="tf-ob-label">
                <span className="tf-ob-label-text">Work email</span>
                <input
                  type="email"
                  className="tf-ob-input"
                  placeholder="you@yourcompany.co.ke"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="tf-ob-label">
                <span className="tf-ob-label-text">Password</span>
                <input
                  type="password"
                  className="tf-ob-input"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </label>
              {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
              <button
                className="tf-cta"
                type="submit"
                disabled={submitting || !email || !password || !name || !isSupabaseConfigured}
                style={{ alignSelf: 'flex-start' }}
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                By signing up you agree to our <Link to="/terms" style={{ color: 'var(--ink)' }}>Terms</Link> and <Link to="/privacy" style={{ color: 'var(--ink)' }}>Privacy policy</Link>.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
