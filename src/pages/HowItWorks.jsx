import { useNavigate } from 'react-router-dom';

const STEPS = [
  { n: '01', h: 'We collect', b: 'Every business day, our team gathers tender notices from ministries, parastatals, corporate procurement portals, and SME networks across 14 African countries.' },
  { n: '02', h: 'We extract', b: 'Each document is parsed for the fields that matter — issuer, source type, sector, deadline, value, location, reference number, and submission method.' },
  { n: '03', h: 'We classify', b: 'Tenders are tagged Government, Private, or SME so you can filter to exactly the kind of opportunities you can win.' },
  { n: '04', h: 'You browse', b: 'One feed. Search, filter, save to watchlist, download the original documents, and never miss a closing date.' }
];

export default function HowItWorks() {
  const navigate = useNavigate();
  return (
    <main>
      <section style={{ padding: '72px 0 48px' }}>
        <div className="tf-container">
          <div className="tf-eyebrow tf-eyebrow-rule">How it works</div>
          <h1 className="tf-display" style={{ fontSize: 'clamp(48px, 5vw, 72px)', marginTop: 16 }}>
            Four steps from <em>scattered</em> to <em>searchable</em>.
          </h1>
        </div>
      </section>
      <section style={{ background: 'var(--paper)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        <div className="tf-container">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 1.6fr',
                gap: 32,
                padding: '40px 0',
                borderBottom: i < STEPS.length - 1 ? '1px solid var(--rule)' : '0',
                alignItems: 'start'
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--gold)', letterSpacing: '0.1em' }}>{s.n}</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 30, color: 'var(--navy)', margin: 0, fontWeight: 500, letterSpacing: '-0.01em' }}>{s.h}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink)', margin: 0, maxWidth: '60ch' }}>{s.b}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="tf-container">
          <h2 className="tf-section-title" style={{ fontSize: 36 }}>Ready to start browsing?</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            <button className="tf-cta" onClick={() => navigate('/tenders')}>Browse all tenders</button>
            <button className="tf-cta-ghost" onClick={() => navigate('/')}>Back to home</button>
          </div>
        </div>
      </section>
    </main>
  );
}
