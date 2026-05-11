import { useNavigate } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import PageHero from '../components/PageHero.jsx';

export default function About() {
  const navigate = useNavigate();
  return (
    <main className="tf-page-anim">
      <PageHero
        eyebrow="About"
        title={<>Africa's procurement market is large, fragmented, and almost entirely <em>invisible</em>.</>}
        subtitle="We're fixing that, one feed at a time."
      />

      <section style={{ background: 'var(--paper)', padding: '56px 0 32px' }}>
        <div className="tf-container" style={{ maxWidth: 760 }}>
          <FadeIn>
            <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>
              Every working day, hundreds of tender notices are published across the
              continent, buried in ministry websites, corporate portals, newspaper
              classifieds, and WhatsApp groups. Most of the people who could win the
              work never see them.
            </p>
            <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.7, marginTop: 18 }}>
              TenderFlow is the first platform to bring government, NGO and SME
              tenders together in one searchable feed. We don't just index, we
              extract the fields that matter so you spend less time reading PDFs
              and more time bidding.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <button className="tf-cta" onClick={() => navigate('/tenders')}>See live tenders</button>
              <button className="tf-cta-ghost" onClick={() => navigate('/how-it-works')}>How it works</button>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
