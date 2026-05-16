import { useNavigate } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import PageHero from '../components/PageHero.jsx';

// AboutPage JSON-LD. Strengthens the brand entity-consolidation signal
// by repeating the Organization on a dedicated about page. Helps Google
// associate the URL https://tenderflow.co.ke/about with the canonical
// TenderFlow entity for knowledge-panel and brand-query ranking.
const ABOUT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  'url': 'https://tenderflow.co.ke/about',
  'name': 'About TenderFlow',
  'description': 'TenderFlow is an East African tender intelligence platform based in Nairobi. We consolidate Government, NGO and SME tender opportunities from Kenya, Uganda and Tanzania into one searchable feed.',
  'inLanguage': 'en-KE',
  'mainEntity': {
    '@type': 'Organization',
    'name': 'TenderFlow',
    'alternateName': ['TenderFlow Kenya', 'TenderFlow East Africa'],
    'url': 'https://tenderflow.co.ke',
    'logo': 'https://tenderflow.co.ke/brand/mark-512.png',
    'foundingDate': '2026',
    'foundingLocation': {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Nairobi',
        'addressCountry': 'KE'
      }
    },
    'areaServed': [
      { '@type': 'Country', 'name': 'Kenya' },
      { '@type': 'Country', 'name': 'Uganda' },
      { '@type': 'Country', 'name': 'Tanzania' }
    ],
    'sameAs': [
      'https://www.linkedin.com/company/tenderflow-east-africa',
      'https://x.com/tenderflow_ea',
      'https://www.facebook.com/TenderFlowEastAfrica',
      'https://share.google/xGvmjVksIbihBug2t'
    ]
  }
};

export default function About() {
  const navigate = useNavigate();
  return (
    <main className="tf-page-anim">
      {/* Inline JSON-LD: Google picks this up wherever it sits in the DOM. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_SCHEMA) }}
      />

      <PageHero
        eyebrow="About TenderFlow"
        title={<>About <em>TenderFlow</em>: East Africa's tender intelligence platform.</>}
        subtitle="We consolidate Government, NGO and SME tenders from Kenya, Uganda and Tanzania into one searchable feed."
      />

      <section style={{ background: 'var(--paper)', padding: '56px 0 32px' }}>
        <div className="tf-container" style={{ maxWidth: 760 }}>
          <FadeIn>
            <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>
              East Africa's procurement market is large, fragmented, and
              almost entirely invisible to the people who could win the work.
              Every working day, hundreds of tender notices are published
              across Kenya, Uganda and Tanzania, buried in ministry websites,
              county procurement portals, donor-funded project bulletins,
              and WhatsApp groups. Most never reach the bidders they were
              meant for.
            </p>
            <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.7, marginTop: 18 }}>
              <strong>TenderFlow</strong> brings government, NGO and SME
              tenders from across the region together in one searchable
              feed. We do not just index, we extract the fields that
              matter so bidders spend less time reading PDFs and more
              time bidding.
            </p>
            <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.7, marginTop: 18 }}>
              We start in East Africa because the region's three biggest
              economies share procurement rules, time zones, and bidder
              networks. As we gain traction, the rest of the continent follows.
            </p>

            <h2 style={{
              fontFamily: 'var(--serif)',
              fontSize: 28,
              color: 'var(--navy)',
              marginTop: 48,
              marginBottom: 16,
              fontWeight: 500
            }}>
              What <em style={{ color: 'var(--gold)' }}>TenderFlow</em> does
            </h2>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              {[
                ['Consolidates', 'Live opportunities from ministries, parastatals, NGOs and SMEs across Kenya, Uganda and Tanzania.'],
                ['Extracts', 'Title, issuer, deadlines, bid security, eligibility, and a requirements checklist, automatically.'],
                ['Notifies', 'Free email digests filtered by sector and country, sent on your schedule.'],
                ['Connects', 'A directory of vetted tender consultants who can prepare and submit bids on your behalf.']
              ].map(([verb, desc]) => (
                <li key={verb} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'start' }}>
                  <strong style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--gold)', fontWeight: 500 }}>
                    {verb}
                  </strong>
                  <span style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--ink)' }}>{desc}</span>
                </li>
              ))}
            </ul>

            <h2 style={{
              fontFamily: 'var(--serif)',
              fontSize: 28,
              color: 'var(--navy)',
              marginTop: 48,
              marginBottom: 16,
              fontWeight: 500
            }}>
              Where to find us
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>
              TenderFlow is based in Nairobi, Kenya. Office at Eden Square Complex,
              Chiromo Road, Westlands, Block 1, 7th Floor. Reach us at{' '}
              <a href="mailto:help@tenderflow.co.ke" style={{ color: 'var(--navy)', borderBottom: '1px solid var(--gold)' }}>
                help@tenderflow.co.ke
              </a>{' '}
              or call <strong>+254 724 131 492</strong>.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
              <button className="tf-cta" onClick={() => navigate('/tenders')}>See live tenders</button>
              <button className="tf-cta-ghost" onClick={() => navigate('/how-it-works')}>How it works</button>
              <button className="tf-cta-ghost" onClick={() => navigate('/contact')}>Contact</button>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
