import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider.jsx';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

// Password strength checker. Returns an object of boolean checks so the
// UI can render each requirement with a tick or circle. All four must
// pass before sign-up is allowed.
function checkPassword(pw) {
  return {
    length: pw.length >= 10,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
}

export default function SignUp() {
  const { signUpWithPassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from || '/dashboard';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdSession, setCreatedSession] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  if (user) return <Navigate to={returnTo} replace />;

  const pwChecks = checkPassword(password);
  const pwScore = Object.values(pwChecks).filter(Boolean).length;
  // Require length + at least 3 of the 4 character-class checks. This is
  // stricter than the old "8 chars total" rule but doesn't force every
  // symbol class which annoys users who prefer passphrase-style passwords.
  const pwPasses = pwChecks.length && pwScore >= 4;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (!pwPasses) {
      setError('Password must be at least 10 characters and include at least three of: uppercase, lowercase, number, symbol.');
      setSubmitting(false);
      return;
    }
    if (!accepted) {
      setError('Please accept the Privacy policy and Terms of service to continue.');
      setSubmitting(false);
      return;
    }
    const { error, data } = await signUpWithPassword(email, password, name);
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    // Stamp consent on the user_profiles row. Best-effort: failures here
    // do not block sign-up (profile row is auto-created by a Postgres
    // trigger; a row may not exist for half a second).
    try {
      if (data?.user?.id && supabase) {
        await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            privacy_accepted_at: new Date().toISOString(),
            terms_accepted_at: new Date().toISOString()
          }, { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('[signup] could not stamp consent', e);
    }
    setSubmitting(false);
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
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label className="tf-ob-label">
                <span className="tf-ob-label-text">Password</span>
                <div className="tf-pw-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="tf-ob-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={10}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="tf-pw-toggle"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {/* Strength meter + per-rule checklist. Each rule renders
                   with a checkmark once met. Strength bar fills as more
                   rules pass; turns gold at "strong" threshold. */}
                <div
                  className={'tf-pw-meter is-score-' + pwScore}
                  aria-hidden="true"
                >
                  <span style={{ width: (pwScore / 5) * 100 + '%' }} />
                </div>
              </label>
              <label className="tf-ob-checkbox" style={{ marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                />
                <span style={{ fontSize: 13 }}>
                  I have read and accept the{' '}
                  <Link to="/privacy" target="_blank" className="tf-policy-link">Privacy Policy</Link>{' '}
                  and{' '}
                  <Link to="/terms" target="_blank" className="tf-policy-link">Terms of Service</Link>.
                </span>
              </label>
              {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
              <button
                className="tf-cta"
                type="submit"
                disabled={submitting || !email || !pwPasses || !name || !accepted || !isSupabaseConfigured}
                style={{ alignSelf: 'flex-start' }}
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
