import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import { useAuth } from '../lib/AuthProvider.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { SECTORS, COUNTRIES } from '../lib/constants.js';

// Single-page consultant profile editor. Replaces walking users through the
// multi-step signup again every time they want to tweak something.
export default function ConsultantEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const photoRef = useRef(null);
  const cvRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [countries, setCountries] = useState([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [cvPath, setCvPath] = useState('');

  useEffect(() => {
    if (!user || !isSupabaseConfigured) { setLoading(false); return; }
    let active = true;
    supabase.from('consultants').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data) {
          setProfile(data);
          setName(data.name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setBio(data.bio || '');
          setSpecialties(data.specialties || []);
          setCountries(data.countries || []);
          setPhotoUrl(data.photo_url || '');
          setPhotoPath(data.photo_path || '');
          setCvUrl(data.cv_url || '');
          setCvPath(data.cv_path || '');
        }
        setLoading(false);
      });
    return () => { active = false; };
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
    setPhotoUploading(true); setError(null);
    try {
      const r = await uploadAsset(file, 'photos');
      setPhotoUrl(r.url); setPhotoPath(r.path);
    } catch (e) { setError('Photo upload failed: ' + e.message); }
    finally { setPhotoUploading(false); }
  }
  async function onCv(file) {
    if (!file) return;
    setCvUploading(true); setError(null);
    try {
      const r = await uploadAsset(file, 'cvs');
      setCvUrl(r.url); setCvPath(r.path);
    } catch (e) { setError('CV upload failed: ' + e.message); }
    finally { setCvUploading(false); }
  }

  async function handleSave() {
    setSaving(true); setError(null); setSavedAt(null);
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      bio: bio || null,
      specialties,
      countries,
      photo_url: photoUrl || null,
      photo_path: photoPath || null,
      cv_url: cvUrl || null,
      cv_path: cvPath || null
    };
    let res;
    if (profile) {
      res = await supabase.from('consultants').update(payload).eq('id', profile.id).select().maybeSingle();
    } else {
      res = await supabase.from('consultants').insert({ ...payload, user_id: user.id, status: 'pending' }).select().maybeSingle();
    }
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    setProfile(res.data);
    setSavedAt(new Date());
  }

  if (loading) {
    return <main style={{ padding: '120px 0', textAlign: 'center' }}><div className="tf-eyebrow">Loading profile…</div></main>;
  }

  if (!profile) {
    return (
      <main className="tf-page-anim" style={{ padding: '64px 0', minHeight: '60vh' }}>
        <div className="tf-container" style={{ maxWidth: 640 }}>
          <div className="tf-eyebrow tf-eyebrow-rule">No consultant profile</div>
          <h1 className="tf-display" style={{ fontSize: 'clamp(36px, 4vw, 52px)', marginTop: 16 }}>
            Apply first to edit a profile.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1.6, marginTop: 14 }}>
            You don't have a consultant profile yet. Set one up in a few minutes.
          </p>
          <button className="tf-cta" style={{ marginTop: 24 }} onClick={() => navigate('/consultant-signup')}>
            Apply to be a consultant
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="tf-page-anim" style={{ padding: '40px 0' }}>
      <div className="tf-container" style={{ maxWidth: 880 }}>
        <FadeIn>
          <Link to="/consultant-dashboard" className="tf-detail-back" style={{ textDecoration: 'none', display: 'inline-block' }}>
            ← Back to dashboard
          </Link>
          <div className="tf-eyebrow tf-eyebrow-rule" style={{ marginTop: 18 }}>Edit profile</div>
          <h1 className="tf-display" style={{ fontSize: 'clamp(36px, 4vw, 52px)', marginTop: 12 }}>
            Update your consultant profile.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.6, marginTop: 12, maxWidth: '62ch' }}>
            Changes save instantly to your profile. If your profile is already approved, it
            stays approved unless you change major fields like name or photo. The admin may
            re-review on substantial edits.
          </p>
        </FadeIn>

        <div className="tf-admin-form" style={{ marginTop: 28, background: 'var(--paper)', padding: 28, border: '1px solid var(--rule)' }}>
          <div className="tf-form-row full">
            <div className="tf-form-field">
              <label>Full name</label>
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
              <label>Short bio</label>
              <textarea rows={5} value={bio} onChange={e => setBio(e.target.value)} />
            </div>
          </div>
          <div className="tf-form-row">
            <div className="tf-form-field">
              <label>Profile photo</label>
              <div className="tf-photo-uploader">
                <div
                  className="tf-photo-uploader-preview"
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
              <label>CV / résumé</label>
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
                  View current CV
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

          <div className="tf-form-row full">
            <div className="tf-form-field">
              <label>Sectors</label>
              <div className="tf-ob-grid tf-ob-grid-countries" style={{ marginTop: 8 }}>
                {SECTORS.map(s => {
                  const on = specialties.includes(s);
                  return (
                    <button
                      type="button"
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
          </div>

          <div className="tf-form-row full">
            <div className="tf-form-field">
              <label>Countries</label>
              <div className="tf-ob-grid tf-ob-grid-countries" style={{ marginTop: 8 }}>
                {COUNTRIES.map(c => {
                  const on = countries.includes(c);
                  return (
                    <button
                      type="button"
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
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          {savedAt && <p style={{ color: 'var(--gold)', fontSize: 13 }}>Saved at {savedAt.toLocaleTimeString()}.</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <button className="tf-cta" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              className="tf-cta-ghost"
              onClick={() => navigate('/consultant-dashboard')}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
