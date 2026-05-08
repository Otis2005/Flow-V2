import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider.jsx';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';

export default function SignIn() {
  const { signInWithMagicLink } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signInWithMagicLink(email.trim().toLowerCase());
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="tf-container" style={{ padding: '72px 0', maxWidth: 540 }}>
      <div className="tf-eyebrow tf-eyebrow-rule">Sign in</div>
      <h1 className="tf-section-title" style={{ marginTop: 12, fontSize: 40 }}>
        Sign in to TenderFlow
      </h1>
      <p className="tf-section-sub" style={{ marginBottom: 32 }}>
        Enter your email and we'll send you a one-click magic link. No passwords.
      </p>

      {!isSupabaseConfigured && (
        <div
          style={{
            padding: 16,
            border: '1px dashed var(--rule)',
            background: 'var(--paper)',
            color: 'var(--muted)',
            fontSize: 13,
            marginBottom: 24
          }}
        >
          Sign-in is disabled until Supabase is configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
        </div>
      )}

      {sent ? (
        <div
          style={{
            padding: 24,
            background: 'var(--paper)',
            border: '1px solid var(--rule)'
          }}
        >
          <div className="tf-eyebrow" style={{ color: 'var(--gold)' }}>Check your inbox</div>
          <h3 style={{ fontFamily: 'var(--serif)', margin: '12px 0', fontSize: 22 }}>
            We sent a magic link to <em>{email}</em>
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Click the link in the email to finish signing in. If you don't see it, check your spam folder.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          <button
            className="tf-cta"
            type="submit"
            disabled={submitting || !email || !isSupabaseConfigured}
            style={{ alignSelf: 'flex-start' }}
          >
            {submitting ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      )}

      <p style={{ marginTop: 32, fontSize: 13, color: 'var(--muted)' }}>
        Need a digest first? <Link to="/digest" style={{ color: 'var(--navy)', borderBottom: '1px solid var(--gold)' }}>Subscribe to the weekly digest</Link>.
      </p>
      {location.state?.from && (
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
          You were redirected from <code>{location.state.from}</code>.
        </p>
      )}
    </main>
  );
}
