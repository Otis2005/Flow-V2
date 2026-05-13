import { useNavigate } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import PageHero from '../components/PageHero.jsx';

export default function About() {
  const navigate = useNavigate();
  return (
    <main className="tf-page-anim">
      <PageHero
        eyebrow="About"
        title={<>East Africa's procurement market is large, fragmented, and almost entirely <em>invisible</em>.</>}
        subtitle="We're fixing that, one tender at a time."
      />

      <section style={{ background: 'var(--paper)', padding: '56px 0 32px' }}>
        <div className="tf-container" style={{ maxWidth: 760 }}>
          <FadeIn>
            <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>
              Every working day, hundreds of tender notices are published across
              Kenya, Uganda and Tanzania, buried in ministry websites, county
              procurement portals, donor-funded project bulletins, and WhatsApp
              groups. Most of the people who could win the work never see them.
            </p>
            <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.7, marginTop: 18 }}>
              TenderFlow brings government, NGO and SME tenders from across
              the region together in one searchable feed. We don't just
              index, we extract the fields that matter so you spend less
              time reading PDFs and more time bidding.
            </p>
            <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.7, marginTop: 18 }}>
              We start in East Africa because the region's three biggest
              economies share procurement rules, time zones, and bidder
              networks. As we gain traction, the rest of the continent follows.
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
