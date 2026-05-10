import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import { Stars } from '../components/StarRating.jsx';
import { useAuth } from '../lib/AuthProvider.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { fmtDate } from '../lib/format.js';

export default function Hire() {
  const [params] = useSearchParams();
  const tenderId = params.get('tender');
  const consultantId = params.get('consultant');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tender, setTender] = useState(null);
  const [consultant, setConsultant] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pickedConsultant, setPickedConsultant] = useState(consultantId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let active = true;
    (async () => {
      const promises = [];
      if (tenderId) {
        promises.push(supabase.from('tenders').select('id, title, issuer, ref_no, closes_at').eq('id', tenderId).maybeSingle());
      } else { promises.push(Promise.resolve({ data: null })); }
      if (consultantId) {
        promises.push(supabase.from('consultants').select('id, name, photo_url, rating, jobs_completed').eq('id', consultantId).eq('status', 'approved').maybeSingle());
      } else { promises.push(Promise.resolve({ data: null })); }
      promises.push(
        supabase.from('consultants').select('id, name, photo_url, specialties, countries, rating, jobs_completed').eq('status', 'approved').limit(50)
      );
      const [t, c, list] = await Promise.all(promises);
      if (!active) return;
      setTender(t.data);
      setConsultant(c.data);
      setConsultants(list.data || []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [tenderId, consultantId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      user_id: user?.id || null,
      user_email: email.trim().toLowerCase(),
      user_name: name || null,
      user_phone: phone || null,
      tender_id: tenderId || null,
      consultant_id: pickedConsultant || null,
      message: message || null,
      status: 'pending'
    };
    const { error } = await supabase.from('hire_requests').insert(payload);
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
    }
  }

  if (loading) {
    return <main style={{ padding: '120px 0', textAlign: 'center' }}><div className="tf-eyebrow">Loading…</div></main>;
  }

  if (done) {
    return (
      <main className="tf-page-anim" style={{ padding: '64px 0', minHeight: '60vh' }}>
        <div className="tf-container" style={{ maxWidth: 640 }}>
          <FadeIn>
            <div className="tf-eyebrow tf-eyebrow-rule">Request received</div>
            <h1 className="tf-display" style={{ fontSize: 'clamp(40px, 4.4vw, 56px)', marginTop: 16 }}>
              Thanks. We'll be in touch <em>shortly.</em>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1.6, marginTop: 14 }}>
              Your request has been logged. {pickedConsultant ? 'The consultant will reach out directly.' : 'Our team will match you with the best consultant for this tender.'}
              {user ? ' You can track the status from your dashboard.' : ' Sign up so you can track its status.'}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              {user
                ? <button className="tf-cta" onClick={() => navigate('/dashboard')}>Open dashboard</button>
                : <button className="tf-cta" onClick={() => navigate('/sign-up')}>Create account</button>}
              <button className="tf-cta-ghost" onClick={() => navigate('/tenders')}>Back to tenders</button>
            </div>
          </FadeIn>
        </div>
      </main>
    );
  }

  return (
    <main className="tf-page-anim" style={{ padding: '40px 0' }}>
      <div className="tf-container" style={{ maxWidth: 880 }}>
        <FadeIn>
          <div className="tf-eyebrow tf-eyebrow-rule">Hire a consultant</div>
          <h1 className="tf-display" style={{ fontSize: 'clamp(36px, 4vw, 52px)', marginTop: 16 }}>
            {tender ? <>Get this tender done <em>for you.</em></> : <>Find a consultant for your tender.</>}
          </h1>
          {tender && (
            <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', padding: 16, marginTop: 22 }}>
              <div className="tf-eyebrow">Tender</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--navy)', fontWeight: 500, marginTop: 6 }}>{tender.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                {tender.issuer} · Ref {tender.ref_no} · Closes {fmtDate(tender.closes_at)}
              </div>
            </div>
          )}
        </FadeIn>

        <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
          <div className="tf-form-row">
            <div className="tf-form-field">
              <label>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="tf-form-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="tf-form-row full">
            <div className="tf-form-field">
              <label>Phone (optional)</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 ..." />
            </div>
          </div>

          <div className="tf-form-row full">
            <div className="tf-form-field">
              <label>Pick a consultant (optional)</label>
              {consultants.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  No consultants in the directory yet. Submit your request and we'll match you manually.
                </p>
              ) : (
                <div className="tf-consultant-grid" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="tf-consultant-card"
                    onClick={() => setPickedConsultant(null)}
                    style={{
                      borderColor: !pickedConsultant ? 'var(--gold)' : 'var(--rule)',
                      background: !pickedConsultant ? 'var(--cream)' : 'var(--paper)',
                      textAlign: 'left'
                    }}
                  >
                    <h3 className="tf-consultant-name">Any consultant</h3>
                    <p className="tf-consultant-bio">Let us match you with the best fit for this tender.</p>
                  </button>
                  {consultants.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="tf-consultant-card"
                      onClick={() => setPickedConsultant(c.id)}
                      style={{
                        borderColor: pickedConsultant === c.id ? 'var(--gold)' : 'var(--rule)',
                        background: pickedConsultant === c.id ? 'var(--cream)' : 'var(--paper)',
                        textAlign: 'left'
                      }}
                    >
                      <div
                        className={'tf-consultant-photo' + (!c.photo_url ? ' empty' : '')}
                        style={c.photo_url ? { backgroundImage: `url(${c.photo_url})` } : undefined}
                      >
                        {!c.photo_url && (c.name || '?')[0]?.toUpperCase()}
                      </div>
                      <h3 className="tf-consultant-name">{c.name}</h3>
                      <Stars value={c.rating} />
                      <div className="tf-consultant-tags" style={{ marginTop: 10 }}>
                        {(c.specialties || []).slice(0, 2).map(s => (
                          <span key={s} className="tf-consultant-tag">{s}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="tf-form-row full">
            <div className="tf-form-field">
              <label>Message (optional)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="Anything you want the consultant to know? Deadlines, scope, your priorities…"
              />
            </div>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
            <button className="tf-cta" type="submit" disabled={submitting || !name || !email}>
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
            <button type="button" className="tf-cta-ghost" onClick={() => navigate(-1)}>Cancel</button>
          </div>
          {!user && (
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
              Tip: <Link to="/sign-up" style={{ color: 'var(--navy)', borderBottom: '1px solid var(--gold)' }}>create an account</Link> so you can track this request from your dashboard.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
