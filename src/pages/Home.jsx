import { Link, useNavigate } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import FadeIn from '../components/FadeIn.jsx';
import { TenderCard } from '../components/TenderViews.jsx';
import { useTenders } from '../lib/useTenders.js';
import { useAuth } from '../lib/AuthProvider.jsx';

export default function Home() {
  const navigate = useNavigate();
  const { tenders } = useTenders();
  const { user } = useAuth();
  const featured = tenders.slice(0, 6);

  const sourceCounts = tenders.reduce(
    (acc, t) => ({ ...acc, [t.source]: (acc[t.source] || 0) + 1 }),
    {}
  );

  const liveToday = tenders.length;
  const countriesCount = new Set(tenders.map(t => t.country)).size;
  const totalValue = tenders.reduce((s, t) => s + (t.value || 0), 0);

  return (
    <main className="tf-page-anim">
      <section className="tf-hero">
        <div className="tf-container">
          <div className="tf-hero-text">
            <div>
              <FadeIn as="h1" className="tf-display">
                Government, NGO and SME tenders, <em>all in one place.</em>
              </FadeIn>
            </div>
            <div className="tf-hero-text-side">
              <FadeIn as="p" delay={120}>
                Stop refreshing twenty portals. We consolidate live opportunities from
                ministries, parastatals, NGOs and SMEs across the continent, so bidders
                stop hunting across twenty websites.
              </FadeIn>
              <FadeIn className="tf-hero-text-actions" delay={240}>
                <button className="tf-cta" onClick={() => navigate(user ? '/dashboard' : '/sign-up')}>
                  {user ? 'Open dashboard' : 'Sign up'}
                </button>
                <button className="tf-cta-ghost" onClick={() => navigate('/tenders')}>
                  Browse all tenders
                </button>
              </FadeIn>
            </div>
          </div>
          <FadeIn className="tf-hero-stats" delay={360}>
            <div className="tf-hero-stat">
              <div className="tf-hero-stat-num">{liveToday}</div>
              <div className="tf-hero-stat-label">Live tenders today</div>
            </div>
            <div className="tf-hero-stat">
              <div className="tf-hero-stat-num">{countriesCount || 14}</div>
              <div className="tf-hero-stat-label">African countries</div>
            </div>
            <div className="tf-hero-stat">
              <div className="tf-hero-stat-num">
                USD <em>{totalValue >= 1_000_000_000
                  ? (totalValue / 1_000_000_000).toFixed(1) + 'B'
                  : (totalValue / 1_000_000).toFixed(1) + 'M'}</em>
              </div>
              <div className="tf-hero-stat-label">Combined contract value</div>
            </div>
            <div className="tf-hero-stat">
              <div className="tf-hero-stat-num">3</div>
              <div className="tf-hero-stat-label">Sources: Govt · NGO · SME</div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section
        style={{
          background: 'var(--paper)',
          borderTop: '1px solid var(--rule)',
          borderBottom: '1px solid var(--rule)',
          padding: '56px 0'
        }}
      >
        <div className="tf-container">
          <FadeIn>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="tf-eyebrow tf-eyebrow-rule">What makes us different</div>
                <h2 className="tf-section-title" style={{ marginTop: 12 }}>Three sources. One disciplined feed.</h2>
              </div>
              <p style={{ color: 'var(--muted)', maxWidth: '44ch', fontSize: 14, margin: 0 }}>
                Most listing services cover one slice. TenderFlow brings together public
                procurement, NGO sourcing, and SME opportunities side by side.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              borderTop: '1px solid var(--rule)'
            }}
          >
            {[
              { src: 'Government', count: sourceCounts.Government || 0, blurb: 'Ministries, parastatals, county and local government tenders across multiple African countries.' },
              { src: 'NGO', count: sourceCounts.NGO || 0, blurb: 'Procurement from non-governmental organisations, donor-funded projects, foundations, and large institutional buyers.' },
              { src: 'SME', count: sourceCounts.SME || 0, blurb: 'SME-friendly tenders with smaller lots, accessible terms, and sub-contracting opportunities.' }
            ].map((s, i, arr) => (
              <FadeIn
                key={s.src}
                delay={i * 100}
                style={{ padding: '32px 28px', borderRight: i < arr.length - 1 ? '1px solid var(--rule)' : '0' }}
              >
                <Badge source={s.src} />
                <div
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 44,
                    color: 'var(--navy)',
                    fontWeight: 500,
                    marginTop: 16,
                    letterSpacing: '-0.015em'
                  }}
                >
                  {s.count}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--muted)'
                  }}
                >
                  Live · Updated daily
                </div>
                <p style={{ marginTop: 18, fontSize: 14, color: 'var(--ink)', lineHeight: 1.55 }}>{s.blurb}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '64px 0 24px' }}>
        <div className="tf-container">
          <FadeIn>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'end',
                marginBottom: 28,
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div>
                <div className="tf-eyebrow tf-eyebrow-rule">Fresh this week</div>
                <h2 className="tf-section-title" style={{ marginTop: 12 }}>Latest tenders</h2>
                <p className="tf-section-sub">Indexed in the last 7 days from official portals, gazette notices and verified buyers.</p>
              </div>
              <Link
                to="/tenders"
                style={{
                  color: 'var(--navy)',
                  fontWeight: 600,
                  fontSize: 13,
                  borderBottom: '1px solid var(--gold)',
                  paddingBottom: 2,
                  textDecoration: 'none'
                }}
              >
                View all {tenders.length} tenders →
              </Link>
            </div>
          </FadeIn>
          <div className="tf-cards-grid">
            {featured.map((t, i) => (
              <FadeIn key={t.id} delay={i * 60}>
                <TenderCard tender={t} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Consultant onboarding banner */}
      <section style={{ padding: '64px 0', background: 'var(--paper)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        <div className="tf-container">
          <FadeIn>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 32,
                alignItems: 'center'
              }}
            >
              <div>
                <div className="tf-eyebrow tf-eyebrow-rule">For tender consultants</div>
                <h2 className="tf-section-title" style={{ marginTop: 12 }}>
                  Are you a tender consultant?
                </h2>
                <p className="tf-section-sub" style={{ maxWidth: '52ch' }}>
                  Bidders win when they have someone in their corner. List your services on
                  TenderFlow and get matched with companies who want their bids done right.
                  Free to register.
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
                  <button className="tf-cta" onClick={() => navigate('/consultant-signup')}>
                    Register as a consultant
                  </button>
                  <button className="tf-cta-ghost" onClick={() => navigate('/consultants')}>
                    Browse consultants
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 'clamp(56px, 6vw, 88px)',
                    color: 'var(--navy)',
                    lineHeight: 1.05,
                    fontWeight: 500,
                    letterSpacing: '-0.02em'
                  }}
                >
                  Get hired<br /><em style={{ color: 'var(--gold)' }}>by serious bidders.</em>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: '72px 0', background: 'var(--cream)' }}>
        <div className="tf-container" style={{ maxWidth: 880, textAlign: 'center', margin: '0 auto' }}>
          <FadeIn>
            <div className="tf-eyebrow" style={{ display: 'inline-block' }}>The mission</div>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(28px, 3.4vw, 42px)',
                color: 'var(--navy)',
                lineHeight: 1.25,
                fontWeight: 400,
                margin: '20px 0 0',
                letterSpacing: '-0.01em'
              }}
            >
              Africa's procurement market is large, fragmented, and almost entirely
              invisible to the people who could win the work.{' '}
              <em style={{ color: 'var(--gold)' }}>We're fixing that.</em>
            </p>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
