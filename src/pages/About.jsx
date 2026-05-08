import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();
  return (
    <main>
      <section style={{ padding: '72px 0 48px' }}>
        <div className="tf-container" style={{ maxWidth: 880 }}>
          <div className="tf-eyebrow tf-eyebrow-rule">About</div>
          <h1 className="tf-display" style={{ fontSize: 'clamp(44px, 4.6vw, 64px)', marginTop: 16 }}>
            Africa's procurement market is large, fragmented, and almost entirely <em>invisible</em>.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.65, marginTop: 32, maxWidth: '62ch' }}>
            Every working day, hundreds of tender notices are published across the
            continent — buried in ministry websites, corporate portals, newspaper
            classifieds, and WhatsApp groups. Most of the people who could win the
            work never see them.
          </p>
          <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.65, marginTop: 16, maxWidth: '62ch' }}>
            TenderFlow is the first platform to bring government, private, NGO and
            SME tenders together in one searchable feed. We don't just index — we
            extract the fields that matter, so you spend less time reading PDFs and
            more time bidding.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            <button className="tf-cta" onClick={() => navigate('/tenders')}>See live tenders</button>
            <button className="tf-cta-ghost" onClick={() => navigate('/how-it-works')}>How it works</button>
          </div>
        </div>
      </section>
    </main>
  );
}
