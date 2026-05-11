import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import { Stars } from '../components/StarRating.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { SECTORS, COUNTRIES } from '../lib/constants.js';

export default function Consultants() {
  const [params, setParams] = useSearchParams();
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get('q') || '');
  const [specialty, setSpecialty] = useState(params.get('specialty') || 'All sectors');
  const [country, setCountry] = useState(params.get('country') || 'All countries');

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('consultants')
        .select('id, name, bio, photo_url, specialties, countries, rating, jobs_completed, status')
        .eq('status', 'approved')
        .order('rating', { ascending: false, nullsFirst: false })
        .order('jobs_completed', { ascending: false });
      if (!active) return;
      setConsultants(data || []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (specialty !== 'All sectors') p.set('specialty', specialty);
    if (country !== 'All countries') p.set('country', country);
    setParams(p, { replace: true });
  }, [q, specialty, country, setParams]);

  const filtered = useMemo(() => {
    return consultants
      .filter(c => !q || (c.name + ' ' + (c.bio || '')).toLowerCase().includes(q.toLowerCase()))
      .filter(c => specialty === 'All sectors' || (c.specialties || []).includes(specialty))
      .filter(c => country === 'All countries' || (c.countries || []).includes(country));
  }, [consultants, q, specialty, country]);

  return (
    <main className="tf-page-anim">
      <section style={{ padding: '56px 0 24px' }}>
        <div className="tf-container">
          <FadeIn>
            <div className="tf-eyebrow tf-eyebrow-rule">Consultants</div>
            <h1 className="tf-display" style={{ fontSize: 'clamp(40px, 4.4vw, 60px)', marginTop: 16 }}>
              Find a consultant who can <em>win this for you.</em>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1.6, marginTop: 14, maxWidth: '62ch' }}>
              Vetted tender writers, evaluators, and bid managers across Africa. Free to
              browse, free to enquire. You only pay if you proceed with an engagement.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
              <Link to="/consultant-signup" className="tf-cta" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Become a consultant
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: '24px 0 64px' }}>
        <div className="tf-container">
          <div className="tf-filters" style={{ marginBottom: 0 }}>
            <div className="tf-field tf-search">
              <label>Search</label>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Name, expertise, keyword…" />
            </div>
            <div className="tf-field tf-field-sm">
              <label>Specialty</label>
              <select value={specialty} onChange={e => setSpecialty(e.target.value)}>
                <option>All sectors</option>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="tf-field tf-field-sm">
              <label>Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)}>
                <option>All countries</option>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 80, textAlign: 'center', color: 'var(--muted)' }}>Loading consultants…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--paper)', border: '1px solid var(--rule)', marginTop: 24 }}>
              <div className="tf-eyebrow">No consultants yet</div>
              <p style={{ marginTop: 12, color: 'var(--muted)' }}>
                {consultants.length === 0
                  ? 'No approved consultants in the directory yet. Check back soon, or apply yourself.'
                  : 'Try clearing some filters.'}
              </p>
              <Link to="/consultant-signup" className="tf-cta" style={{ marginTop: 18, display: 'inline-block', textDecoration: 'none' }}>
                Apply to be a consultant
              </Link>
            </div>
          ) : (
            <div className="tf-consultant-grid">
              {filtered.map((c, i) => (
                <FadeIn key={c.id} delay={i * 50}>
                  <Link to={`/consultants/${c.id}`} className="tf-consultant-card">
                    <div
                      className={'tf-consultant-photo' + (!c.photo_url ? ' empty' : '')}
                      style={c.photo_url ? { backgroundImage: `url(${c.photo_url})` } : undefined}
                    >
                      {!c.photo_url && (c.name || '?')[0]?.toUpperCase()}
                    </div>
                    <h3 className="tf-consultant-name">{c.name}</h3>
                    <div className="tf-consultant-spec">
                      {(c.specialties || []).slice(0, 3).join(' · ') || 'All sectors'}
                    </div>
                    {c.bio && <p className="tf-consultant-bio">{c.bio.slice(0, 140)}{c.bio.length > 140 ? '…' : ''}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                      <Stars value={c.rating} />
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {c.jobs_completed || 0} job{c.jobs_completed === 1 ? '' : 's'} done
                      </span>
                    </div>
                    {(c.countries || []).length > 0 && (
                      <div className="tf-consultant-tags" style={{ marginTop: 10 }}>
                        {c.countries.slice(0, 3).map(co => (
                          <span key={co} className="tf-consultant-tag">{co}</span>
                        ))}
                      </div>
                    )}
                  </Link>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
