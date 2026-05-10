import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import { useAuth } from '../lib/AuthProvider.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { SECTORS, COUNTRIES } from '../lib/constants.js';

const STEPS = ['Account', 'Profile', 'Specialties', 'Submit'];

export default function ConsultantSignup() {
  const { user, signUpWithPassword, signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const photoRef = useRef(null);
  const cvRef = useRef(null);

  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [existing, setExisting] = useState(null);

  // Account fields
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [signInOnly, setSignInOnly] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [cvPath, setCvPath] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);

  // Specialties fields
  const [specialties, setSpecialties] = useState([]);
  const [countries, setCountries] = useState([]);

  // If logged in, skip step 1 and check whether they already have a profile.
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    setName(prev => prev || user.user_metadata?.full_name || '');
    setEmail(prev => prev || user.email || '');
    supabase.from('consultants').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setExisting(data);
        else if (step === 1) setStep(2);
      });
  }, [user]);

  function toggle(arr, v, set) {
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  }

  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9.]/g, '-').replace(/-+/g, '-'); }

  async function uploadAsset(file, prefix) {
    const path = `${prefix}/${Date.now()}-${slug(file.name)}`;
    const { error } = await supabase.storage
      .from('consultant-assets')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('consultant-assets').getPublicUrl(path);
    return { path, url: data?.publicUrl };
  }

  async function onPhoto(file) {
    if (!file) return;
    setPhotoUploading(true);
    setError(null);
    try {
      const r = await uploadAsset(file, 'photos');
      setPhotoUrl(r.url); setPhotoPath(r.path);
    } catch (e) {
      setError('Photo upload failed: ' + e.message);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function onCv(file) {
    if (!file) return;
    setCvUploading(true);
    setError(null);
    try {
      const r = await uploadAsset(file, 'cvs');
      setCvUrl(r.url); setCvPath(r.path);
    } catch (e) {
      setError('CV upload failed: ' + e.message);
    } finally {
      setCvUploading(false);
    }
  }

  async function handleAccount(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (signInOnly) {
      const { error } = await signInWithPassword(authEmail, authPassword);
      setSubmitting(false);
      if (error) { setError(error.message); return; }
      // Wait for AuthProvider to hydrate, then move on.
    } else {
      if (authPassword.length < 8) {
        setError('Password must be at least 8 characters.');
        setSubmitting(false);
        return;
      }
      const { error, data } = await signUpWithPassword(authEmail, authPassword, authName);
      setSubmitting(false);
      if (error) { setError(error.message); return; }
      if (!data?.session) {
        // Email confirmation required
        setError('We sent a confirmation email to ' + authEmail + '. Please verify and then sign in to continue.');
        return;
      }
    }
    setName(authName);
    setEmail(authEmail);
    setStep(2);
  }

  async function handleSubmit() {
    if (!user) { setError('You must be signed in.'); return; }
    setSubmitting(true);
    setError(null);
    const payload = {
      user_id: user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      bio: bio || null,
      specialties,
      countries,
      cv_url: cvUrl || null,
      cv_path: cvPath || null,
      photo_url: photoUrl || null,
      photo_path: photoPath || null,
      status: 'pending'
    };
    let res;
    if (existing) {
      res = await supabase.from('consultants').update(payload).eq('id', existing.id).select().maybeSingle();
    } else {
      res = await supabase.from('consultants').insert(payload).select().maybeSingle();
    }
    setSubmitting(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }

    // Best-effort admin email notification. We deliberately do not await this
    // in a way that could block UX feedback; failures are logged but the user
    // proceeds to the success screen regardless.
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token && res.data?.id) {
        fetch('/api/notify-consultant', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ consultant_id: res.data.id })
        }).catch(err => console.warn('[notify-consultant] notify failed', err));
      }
    } catch (e) {
      console.warn('[notify-consultant] could not dispatch', e);
    }

    setDone(true);
  }

  if (done) {
    return (
      <main className="tf-page-anim" style={{ padding: '64px 0', minHeight: '60vh' }}>
        <div className="tf-container" style={{ maxWidth: 720 }}>
          <FadeIn>
            <div className="tf-eyebrow tf-eyebrow-rule">Application received</div>
            <h1 className="tf-display" style={{ fontSize: 'clamp(40px, 4.4vw, 56px)', marginTop: 16 }}>
              Thanks, your profile is in <em>review.</em>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1.6, marginTop: 18, maxWidth: '60ch' }}>
              We review consultant applications within 1–2 working days to keep the directory
              high-quality. Once approved, your profile appears in the public consultants list
              and bidders can hire you directly.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <button className="tf-cta" onClick={() => navigate('/consultant-dashboard')}>
                Open consultant dashboard
              </button>
              <button className="tf-cta-ghost" onClick={() => navigate('/')}>
                Back to home
              </button>
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
          <div className="tf-eyebrow tf-eyebrow-rule">Become a consultant</div>
          <h1 className="tf-display" style={{ fontSize: 'clamp(40px, 4.4vw, 56px)', marginTop: 16 }}>
            Help bidders win,<em>get hired by serious buyers.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1.6, marginTop: 14, maxWidth: '60ch' }}>
            List your tender consultancy services on TenderFlow. Free to register, you only
            pay a small platform fee on completed engagements.
          </p>
        </FadeIn>

        {/* Progress dots */}
        <div className="tf-ob-dots" style={{ marginTop: 32 }}>
          {STEPS.map((label, i) => (
            <span
              key={i}
              className={'tf-ob-dot' + (i < step ? ' is-done' : '') + (i === step - 1 ? ' is-active' : '')}
              title={label}
            />
          ))}
          <span className="tf-ob-step-text">Step {step} of {STEPS.length}: {STEPS[step - 1]}</span>
        </div>

        {error && (
          <div style={{ marginTop: 20, padding: 14, border: '1px dashed var(--danger)', background: 'var(--paper)', color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Step 1: Account */}
        {step === 1 && !user && (
          <form onSubmit={handleAccount} style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
            <div className="tf-segmented">
              <button type="button" className={!signInOnly ? 'is-active' : ''} onClick={() => setSignInOnly(false)}>Create account</button>
              <button type="button" className={signInOnly ? 'is-active' : ''} onClick={() => setSignInOnly(true)}>I already have one</button>
            </div>
            {!signInOnly && (
              <label className="tf-ob-label">
                <span className="tf-ob-label-text">Your name</span>
                <input className="tf-ob-input" value={authName} onChange={e => setAuthName(e.target.value)} required />
              </label>
            )}
            <label className="tf-ob-label">
              <span className="tf-ob-label-text">Email</span>
              <input type="email" className="tf-ob-input" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
            </label>
            <label className="tf-ob-label">
              <span className="tf-ob-label-text">Password</span>
              <input type="password" className="tf-ob-input" minLength={8} value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
            </label>
            <div>
              <button className="tf-cta" type="submit" disabled={submitting}>
                {submitting ? 'Working…' : (signInOnly ? 'Sign in & continue' : 'Create account & continue')}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Profile */}
        {step === 2 && (
          <div style={{ marginTop: 32 }}>
            <div className="tf-form-row full">
              <div className="tf-form-field">
                <label>Your full name</label>
                <input value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>
            <div className="tf-form-row">
              <div className="tf-form-field">
                <label>Contact email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="tf-form-field">
                <label>Phone (with country code)</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000" />
              </div>
            </div>
            <div className="tf-form-row full">
              <div className="tf-form-field">
                <label>Short bio (1–2 paragraphs)</label>
                <textarea
                  rows={5}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="What's your background, your sector strengths, and how have you helped bidders win?"
                />
              </div>
            </div>

            <div className="tf-form-row">
              <div className="tf-form-field">
                <label>Profile photo (professional)</label>
                <div className="tf-photo-uploader">
                  <div
                    className={'tf-photo-uploader-preview' + (!photoUrl ? '' : '')}
                    style={photoUrl ? { backgroundImage: `url(${photoUrl})`, borderRadius: '50%' } : { borderRadius: '50%' }}
                  />
                  <button
                    type="button"
                    className="tf-cta-ghost"
                    style={{ padding: '8px 14px', fontSize: 12 }}
                    onClick={() => photoRef.current?.click()}
                    disabled={photoUploading}
                  >
                    {photoUploading ? 'Uploading…' : (photoUrl ? 'Replace photo' : 'Upload photo')}
                  </button>
                  <input
                    type="file"
                    ref={photoRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => onPhoto(e.target.files?.[0])}
                  />
                </div>
              </div>
              <div className="tf-form-field">
                <label>CV / résumé (PDF preferred)</label>
                <button
                  type="button"
                  className="tf-cta-ghost"
                  onClick={() => cvRef.current?.click()}
                  disabled={cvUploading}
                  style={{ marginTop: 6 }}
                >
                  {cvUploading ? 'Uploading…' : (cvUrl ? 'Replace CV' : 'Upload CV')}
                </button>
                {cvUrl && (
                  <a href={cvUrl} target="_blank" rel="noopener" style={{ display: 'block', fontSize: 12, color: 'var(--navy)', marginTop: 6, borderBottom: '1px solid var(--gold)', width: 'fit-content' }}>
                    View uploaded CV
                  </a>
                )}
                <input
                  type="file"
                  ref={cvRef}
                  accept="application/pdf,.pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={e => onCv(e.target.files?.[0])}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
              <button className="tf-cta-ghost" onClick={() => setStep(1)}>← Back</button>
              <span style={{ flex: 1 }} />
              <button
                className="tf-cta"
                disabled={!name || !email}
                onClick={() => setStep(3)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Specialties */}
        {step === 3 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--navy)', fontWeight: 500, margin: 0 }}>
              Where do you specialise?
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
              Pick the sectors and countries you've handled tenders in. Bidders use these
              to find the right consultant.
            </p>

            <div style={{ marginTop: 22 }}>
              <div className="tf-eyebrow">Sectors</div>
              <div className="tf-ob-grid tf-ob-grid-countries" style={{ marginTop: 12 }}>
                {SECTORS.map(s => {
                  const on = specialties.includes(s);
                  return (
                    <button
                      key={s}
                      className={'tf-ob-chip' + (on ? ' is-selected' : '')}
                      onClick={() => toggle(specialties, s, setSpecialties)}
                    >
                      <span className="tf-ob-chip-dot" />
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <div className="tf-eyebrow">Countries</div>
              <div className="tf-ob-grid tf-ob-grid-countries" style={{ marginTop: 12 }}>
                {COUNTRIES.map(c => {
                  const on = countries.includes(c);
                  return (
                    <button
                      key={c}
                      className={'tf-ob-chip' + (on ? ' is-selected' : '')}
                      onClick={() => toggle(countries, c, setCountries)}
                    >
                      <span className="tf-ob-chip-dot" />
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
              <button className="tf-cta-ghost" onClick={() => setStep(2)}>← Back</button>
              <span style={{ flex: 1 }} />
              <button
                className="tf-cta"
                onClick={() => setStep(4)}
                disabled={specialties.length === 0 || countries.length === 0}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Submit */}
        {step === 4 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--navy)', fontWeight: 500, margin: 0 }}>
              Ready to submit
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
              We review every consultant within 1-2 working days. Once approved, your profile
              appears in the public directory and bidders can hire you.
            </p>
            <div style={{ marginTop: 24, padding: 22, background: 'var(--paper)', border: '1px solid var(--rule)' }}>
              <div className="tf-eyebrow">Profile preview</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12 }}>
                <div
                  className="tf-consultant-photo"
                  style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
                >
                  {!photoUrl && (name?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <div className="tf-consultant-name">{name || 'Your name'}</div>
                  <div className="tf-consultant-spec">
                    {specialties.length} sectors · {countries.length} countries
                  </div>
                </div>
              </div>
              {bio && <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.55 }}>{bio}</p>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
              <button className="tf-cta-ghost" onClick={() => setStep(3)}>← Back</button>
              <span style={{ flex: 1 }} />
              <button
                className="tf-cta"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : (existing ? 'Resubmit for review' : 'Submit for review')}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
