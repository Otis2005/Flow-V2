import { useNavigate } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import FadeIn from '../components/FadeIn.jsx';

const STEPS = [
  { n: '01', h: 'We collect', b: 'Every business day, our team gathers tender notices from ministries, parastatals, corporate procurement portals, and SME networks across 14 African countries.' },
  { n: '02', h: 'We extract', b: 'Each document is parsed for the fields that matter, issuer, source type, sector, deadline, value, location, reference number, and submission method.' },
  { n: '03', h: 'We classify', b: 'Tenders are tagged Government, NGO, or SME so you can filter to exactly the kind of opportunities you can win.' },
  { n: '04', h: 'You browse', b: 'One feed. Search, filter, save to watchlist, download the original documents, and never miss a closing date.' }
];

export default function HowItWorks() {
  const navigate = useNavigate();
  return (
    <main className="tf-page-anim">
      <PageHero
        eyebrow="How it works"
        title={<>Four steps from <em>scattered</em> to <em>searchable</em>.</>}
        subtitle="No subscriptions, no tracking. Bidders find the right tenders, faster."
      />
      <section style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
        <div className="tf-container">
          {STEPS.map((s, i) => (
            <FadeIn
              key={s.n}
              delay={i * 80}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 1.6fr',
                gap: 32,
                padding: '36px 0',
                borderBottom: i < STEPS.length - 1 ? '1px solid var(--rule)' : '0',
                alignItems: 'start'
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--gold)', letterSpacing: '0.1em' }}>{s.n}</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--navy)', margin: 0, fontWeight: 500, letterSpacing: '-0.01em' }}>{s.h}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink)', margin: 0, maxWidth: '60ch' }}>{s.b}</p>
            </FadeIn>
          ))}
        </div>
      </section>
      <section className="tf-band tf-band-navy">
        <div className="tf-container" style={{ textAlign: 'center' }}>
          <FadeIn>
            <h2 className="tf-section-title tf-section-title-sm tf-on-navy" style={{ display: 'inline-block' }}>
              Ready to browse?
            </h2>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              <button className="tf-cta tf-cta-on-navy" onClick={() => navigate('/tenders')}>Browse all tenders</button>
              <button className="tf-cta-ghost tf-cta-ghost-on-navy" onClick={() => navigate('/')}>Back to home</button>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
