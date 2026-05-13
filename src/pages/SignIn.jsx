import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider.jsx';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';

export default function SignIn() {
  const { signInWithPassword, signInWithMagicLink, user } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [magicSent, setMagicSent] = useState(false);
  const [mode, setMode] = useState('password'); // 'password' | 'magic'

  if (user) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />;
  }

  async function handlePassword(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signInWithPassword(email, password);
    setSubmitting(false);
    if (error) setError(error.message);
  }

  async function handleMagic(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signInWithMagicLink(email, '/dashboard');
    setSubmitting(false);
    if (error) setError(error.message); else setMagicSent(true);
  }

  return (
    <main className="tf-page-anim">
      <div className="tf-auth-shell">
        <div className="tf-auth-art">
          <div>
            <div className="tf-eyebrow tf-eyebrow-rule" style={{ color: 'rgba(245,246,235,0.6)' }}>Welcome back</div>
            <h2>
              Tender intelligence,<br />
              <em>at your fingertips.</em>
            </h2>
            <p>
              Sign in to access your watchlist, manage consultancy requests, and keep track
              of bids you're working on.
            </p>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(245,246,235,0.5)', marginTop: 24 }}>
            Regional Tender Intelligence. At your Fingertips.
          </div>
        </div>
        <div className="tf-auth-form">
          <div className="tf-eyebrow tf-eyebrow-rule">Sign in</div>
          <h1 className="tf-section-title" style={{ marginTop: 12, fontSize: 36 }}>Welcome back</h1>
          <p className="tf-section-sub" style={{ marginBottom: 28 }}>
            New here? <Link to="/sign-up" style={{ color: 'var(--navy)', borderBottom: '1px solid var(--gold)' }}>Create an account</Link>.
          </p>

          {!isSupabaseConfigured && (
            <div style={{ padding: 16, border: '1px dashed var(--rule)', background: 'var(--paper)', color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
              Sign-in is disabled until Supabase is configured.
            </div>
          )}

          <div className="tf-segmented" style={{ marginBottom: 18 }}>
            <button className={mode === 'password' ? 'is-active' : ''} onClick={() => setMode('password')}>Password</button>
            <button className={mode === 'magic' ? 'is-active' : ''} onClick={() => setMode('magic')}>Magic link</button>
          </div>

          {magicSent ? (
            <div style={{ padding: 24, background: 'var(--paper)', border: '1px solid var(--rule)' }}>
              <div className="tf-eyebrow" style={{ color: 'var(--gold)' }}>Check your inbox</div>
              <h3 style={{ fontFamily: 'var(--serif)', margin: '12px 0', fontSize: 22 }}>
                We sent a magic link to <em>{email}</em>
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                Click the link to finish signing in. Check your spam folder if it doesn't appear.
              </p>
            </div>
          ) : (
            <form onSubmit={mode === 'password' ? handlePassword : handleMagic} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="tf-ob-label">
                <span className="tf-ob-label-text">Email</span>
                <input
                  type="email"
                  className="tf-ob-input"
                  placeholder="you@yourcompany.co.ke"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              {mode === 'password' && (
                <label className="tf-ob-label">
                  <span className="tf-ob-label-text">Password</span>
                  <input
                    type="password"
                    className="tf-ob-input"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </label>
              )}
              {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
              <button
                className="tf-cta"
                type="submit"
                disabled={submitting || !email || (mode === 'password' && !password) || !isSupabaseConfigured}
                style={{ alignSelf: 'flex-start' }}
              >
                {submitting
                  ? (mode === 'password' ? 'Signing in…' : 'Sending…')
                  : (mode === 'password' ? 'Sign in' : 'Send magic link')}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
