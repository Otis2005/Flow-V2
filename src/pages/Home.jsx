import { Link, useNavigate } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import FadeIn from '../components/FadeIn.jsx';
import HeroBackdrop from '../components/HeroBackdrop.jsx';
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
        <HeroBackdrop />
        <div className="tf-container">
          <div className="tf-hero-text">
            <div>
              <FadeIn as="h1" className="tf-display">
                Government, NGO and SME tenders, <em>all in one place.</em>
              </FadeIn>
            </div>
            <div className="tf-hero-text-side">
              <FadeIn as="p" delay={120}>
                We consolidate live opportunities from ministries, parastatals,
                NGOs and SMEs across East Africa.
              </FadeIn>
              <FadeIn className="tf-hero-text-actions" delay={240}>
                <button
                  className="tf-cta"
                  onClick={() => navigate(user ? '/dashboard' : '/sign-up')}
                >
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
              <div className="tf-hero-stat-num">{countriesCount || 3}</div>
              <div className="tf-hero-stat-label">East African countries</div>
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

      {/* Three sources, compact navy band */}
      <section className="tf-band tf-band-navy tf-band-sources">
        <div className="tf-container">
          <FadeIn className="tf-band-head">
            <div>
              <div className="tf-eyebrow tf-eyebrow-rule" style={{ color: 'rgba(245,246,235,0.6)' }}>
                Three sources, one feed
              </div>
              <h2 className="tf-section-title tf-section-title-sm tf-on-navy">
                What makes us different
              </h2>
            </div>
            <p className="tf-band-blurb tf-on-navy-muted">
              Public procurement, NGO sourcing, and SME opportunities, side by side.
            </p>
          </FadeIn>
          <div className="tf-source-cols tf-source-cols-navy">
            {[
              { src: 'Government', count: sourceCounts.Government || 0, blurb: 'Ministries, parastatals, county and local government tenders from Kenya, Uganda, and Tanzania.' },
              { src: 'NGO',        count: sourceCounts.NGO || 0,        blurb: 'NGOs, donor-funded projects, foundations, and institutional buyers across the region.' },
              { src: 'SME',        count: sourceCounts.SME || 0,        blurb: 'Smaller lots, accessible terms, sub-contracting opportunities for growing businesses.' }
            ].map((s, i, arr) => (
              <FadeIn
                key={s.src}
                delay={i * 90}
                className="tf-source-col"
                style={{ borderRight: i < arr.length - 1 ? '1px solid rgba(245,246,235,0.12)' : '0' }}
              >
                <Badge source={s.src} />
                <div className="tf-source-count">{s.count}</div>
                <div className="tf-source-meta">Live · Updated daily</div>
                <p className="tf-source-blurb">{s.blurb}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Latest tenders */}
      <section className="tf-band tf-band-light">
        <div className="tf-container">
          <FadeIn className="tf-band-head">
            <div>
              <div className="tf-eyebrow tf-eyebrow-rule">Fresh this week</div>
              <h2 className="tf-section-title tf-section-title-sm">Latest tenders</h2>
            </div>
            <Link to="/tenders" className="tf-band-link">
              View all {tenders.length} tenders →
            </Link>
          </FadeIn>
          <div className="tf-cards-grid">
            {featured.map((t, i) => (
              <FadeIn key={t.id} delay={i * 70}>
                <TenderCard tender={t} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Consultant banner, compact two-column */}
      <section className="tf-band tf-band-navy">
        <div className="tf-container">
          <FadeIn className="tf-cta-band">
            <div>
              <div className="tf-eyebrow tf-eyebrow-rule" style={{ color: 'rgba(245,246,235,0.6)' }}>
                For consultants
              </div>
              <h2 className="tf-cta-band-title">
                Get hired by serious bidders.
              </h2>
              <p className="tf-cta-band-sub">
                List your tender consultancy on TenderFlow. Free to register, free to be discovered.
              </p>
            </div>
            <div className="tf-cta-band-actions">
              <button className="tf-cta tf-cta-on-navy" onClick={() => navigate('/consultant-signup')}>
                Register as consultant
              </button>
              <button className="tf-cta-ghost tf-cta-ghost-on-navy" onClick={() => navigate('/consultants')}>
                Browse consultants
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="tf-band tf-band-mission">
        <div className="tf-container">
          <FadeIn>
            <div className="tf-eyebrow" style={{ display: 'inline-block' }}>The mission</div>
            <p className="tf-mission-line">
              East Africa's procurement market is large, fragmented, and almost entirely
              invisible to the people who could win the work.{' '}
              <em style={{ color: 'var(--gold)' }}>We're fixing that.</em>
            </p>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
