import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import { Stars } from '../components/StarRating.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

export default function ConsultantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from('consultants').select('*').eq('id', id).eq('status', 'approved').maybeSingle()
      .then(({ data }) => { setC(data); setLoading(false); });
  }, [id]);

  if (loading) {
    return <main style={{ padding: '120px 0', textAlign: 'center' }}><div className="tf-eyebrow">Loading…</div></main>;
  }
  if (!c) {
    return (
      <main className="tf-container" style={{ padding: '120px 0', maxWidth: 640 }}>
        <div className="tf-eyebrow tf-eyebrow-rule">Not found</div>
        <h1 className="tf-section-title" style={{ marginTop: 12 }}>Consultant not available.</h1>
        <Link to="/consultants" className="tf-cta" style={{ display: 'inline-block', textDecoration: 'none', marginTop: 24 }}>Back to directory</Link>
      </main>
    );
  }

  return (
    <main className="tf-page-anim">
      <section style={{ padding: '48px 0 24px' }}>
        <div className="tf-container">
          <div className="tf-detail-back" onClick={() => navigate('/consultants')}>← Back to consultants</div>
          <FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, marginTop: 24, alignItems: 'center' }}>
              <div
                className={'tf-consultant-photo' + (!c.photo_url ? ' empty' : '')}
                style={{ width: 140, height: 140, ...(c.photo_url ? { backgroundImage: `url(${c.photo_url})` } : {}) }}
              >
                {!c.photo_url && (c.name || '?')[0]?.toUpperCase()}
              </div>
              <div>
                <div className="tf-eyebrow tf-eyebrow-rule">Consultant</div>
                <h1 className="tf-display" style={{ fontSize: 'clamp(36px, 4vw, 52px)', marginTop: 12 }}>{c.name}</h1>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                  <Stars value={c.rating} size="lg" />
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {c.jobs_completed || 0} job{c.jobs_completed === 1 ? '' : 's'} completed
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: '24px 0 64px' }}>
        <div className="tf-container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 40 }}>
          <div>
            {c.bio && (
              <FadeIn className="tf-detail-section">
                <h3>About</h3>
                <p>{c.bio}</p>
              </FadeIn>
            )}
            {(c.specialties || []).length > 0 && (
              <FadeIn className="tf-detail-section">
                <h3>Specialties</h3>
                <div className="tf-consultant-tags">
                  {c.specialties.map(s => <span key={s} className="tf-consultant-tag">{s}</span>)}
                </div>
              </FadeIn>
            )}
            {(c.countries || []).length > 0 && (
              <FadeIn className="tf-detail-section">
                <h3>Countries</h3>
                <div className="tf-consultant-tags">
                  {c.countries.map(co => <span key={co} className="tf-consultant-tag">{co}</span>)}
                </div>
              </FadeIn>
            )}
          </div>
          <aside>
            <div className="tf-detail-keyfacts">
              <div className="tf-detail-keyfacts-head">
                <div className="tf-eyebrow" style={{ color: 'var(--gold-soft)' }}>Hire</div>
                <div className="tf-detail-deadline" style={{ fontSize: 22 }}>{c.name}</div>
                <div className="tf-detail-countdown">
                  Free to enquire
                </div>
              </div>
              <div style={{ padding: '16px 22px 22px' }}>
                <button
                  className="tf-cta"
                  style={{ width: '100%' }}
                  onClick={() => navigate(`/hire?consultant=${c.id}`)}
                >
                  Request this consultant
                </button>
                {c.cv_url && (
                  <a
                    href={c.cv_url}
                    target="_blank"
                    rel="noopener"
                    className="tf-cta-ghost"
                    style={{ width: '100%', marginTop: 8, textDecoration: 'none', textAlign: 'center', display: 'block' }}
                  >
                    View CV
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
