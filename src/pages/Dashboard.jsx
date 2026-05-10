import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import { TenderCard } from '../components/TenderViews.jsx';
import { Stars } from '../components/StarRating.jsx';
import { useAuth } from '../lib/AuthProvider.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { fmtDate } from '../lib/format.js';

function rowToTender(r) {
  return {
    id: r.id, title: r.title, issuer: r.issuer, country: r.country,
    source: r.source, sector: r.sector, value: r.value ?? 0,
    currency: r.currency ?? 'USD', published: r.published_at,
    closes: r.closes_at, refNo: r.ref_no, summary: r.summary,
    documents: r.documents ?? [], status: r.status,
    bid_security: r.bid_security, issuer_rating: r.issuer_rating
  };
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [hireRequests, setHireRequests] = useState([]);
  const [consultantProfile, setConsultantProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    let active = true;
    (async () => {
      setLoading(true);
      const [profRes, watchRes, hireRes, consRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase
          .from('watchlist')
          .select('tender_id, created_at, tender:tenders(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('hire_requests')
          .select('*, consultant:consultants(name, photo_url), tender:tenders(title, issuer)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('consultants').select('*').eq('user_id', user.id).maybeSingle()
      ]);
      if (!active) return;
      setProfile(profRes.data);
      const tenders = (watchRes.data || [])
        .map(r => r.tender)
        .filter(Boolean)
        .map(rowToTender);
      setWatchlist(tenders);
      setHireRequests(hireRes.data || []);
      setConsultantProfile(consRes.data);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  if (!user) return null;

  const displayName = profile?.full_name || profile?.display_name || user.email?.split('@')[0] || 'there';

  return (
    <main className="tf-page-anim">
      <section style={{ padding: '48px 0 24px' }}>
        <div className="tf-container">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="tf-eyebrow tf-eyebrow-rule">Your dashboard</div>
              <h1 className="tf-display" style={{ fontSize: 'clamp(40px, 4.4vw, 60px)', marginTop: 16 }}>
                Welcome back, <em>{displayName}.</em>
              </h1>
            </div>
            <span style={{ flex: 1 }} />
            <button className="tf-cta-ghost" onClick={() => signOut().then(() => navigate('/'))}>
              Sign out
            </button>
          </div>

          <FadeIn className="tf-dash-grid">
            <div className="tf-dash-stat">
              <div className="tf-dash-stat-num">{watchlist.length}</div>
              <div className="tf-dash-stat-label">Saved tenders</div>
            </div>
            <div className="tf-dash-stat">
              <div className="tf-dash-stat-num">{hireRequests.length}</div>
              <div className="tf-dash-stat-label">Consultancy requests</div>
            </div>
            <div className="tf-dash-stat">
              <div className="tf-dash-stat-num">{hireRequests.filter(h => h.status === 'completed').length}</div>
              <div className="tf-dash-stat-label">Completed jobs</div>
            </div>
            <div className="tf-dash-stat">
              <div className="tf-dash-stat-num">
                {consultantProfile ? '✓' : '–'}
              </div>
              <div className="tf-dash-stat-label">
                {consultantProfile
                  ? `Consultant: ${consultantProfile.status}`
                  : 'Not a consultant'}
              </div>
              {!consultantProfile && (
                <Link to="/consultant-signup" style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: 'var(--navy)', borderBottom: '1px solid var(--gold)' }}>
                  Become one →
                </Link>
              )}
              {consultantProfile && (
                <Link to="/consultant-dashboard" style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: 'var(--navy)', borderBottom: '1px solid var(--gold)' }}>
                  Open consultant dashboard →
                </Link>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: '40px 0', background: 'var(--paper)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        <div className="tf-container">
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div>
              <div className="tf-eyebrow tf-eyebrow-rule">Watchlist</div>
              <h2 className="tf-section-title" style={{ marginTop: 12 }}>Tenders you're tracking</h2>
            </div>
            <Link to="/tenders" style={{ color: 'var(--navy)', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--gold)', paddingBottom: 2, textDecoration: 'none' }}>
              Browse more tenders →
            </Link>
          </div>
          {loading ? (
            <div style={{ padding: 80, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
          ) : watchlist.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--cream)', border: '1px solid var(--rule)' }}>
              <div className="tf-eyebrow">Empty watchlist</div>
              <p style={{ marginTop: 12, color: 'var(--muted)' }}>
                Save tenders to keep an eye on closing dates and required documents.
              </p>
              <button className="tf-cta" style={{ marginTop: 18 }} onClick={() => navigate('/tenders')}>
                Browse tenders
              </button>
            </div>
          ) : (
            <div className="tf-cards-grid">
              {watchlist.map((t, i) => (
                <FadeIn key={t.id} delay={i * 50}>
                  <TenderCard tender={t} />
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: '40px 0' }}>
        <div className="tf-container">
          <div style={{ marginBottom: 24 }}>
            <div className="tf-eyebrow tf-eyebrow-rule">Consultancy requests</div>
            <h2 className="tf-section-title" style={{ marginTop: 12 }}>Tenders being prepared for you</h2>
          </div>
          {loading ? null : hireRequests.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--paper)', border: '1px solid var(--rule)' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                You have not requested a consultant for any tender yet. Open a tender and click
                "Get this tender done for me" to get matched.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hireRequests.map(h => (
                <div key={h.id} style={{ background: 'var(--paper)', border: '1px solid var(--rule)', padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--navy)', fontWeight: 500 }}>
                      {h.tender?.title || 'Tender'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {h.consultant?.name ? `Consultant: ${h.consultant.name}` : 'Awaiting consultant assignment'}
                      {' · '}Created {fmtDate(h.created_at)}
                    </div>
                    {h.message && <p style={{ fontSize: 13, color: 'var(--ink)', marginTop: 8 }}>{h.message}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="tf-badge" data-source={h.status === 'completed' ? 'Government' : 'SME'} style={{ textTransform: 'uppercase' }}>
                      {h.status}
                    </span>
                    {h.status === 'completed' && h.rating && (
                      <div style={{ marginTop: 6 }}><Stars value={h.rating} /></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
