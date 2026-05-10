import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

function PageShell({ eyebrow, title, intro, children }) {
  return (
    <main>
      <section style={{ padding: '72px 0 32px' }}>
        <div className="tf-container" style={{ maxWidth: 880 }}>
          <div className="tf-eyebrow tf-eyebrow-rule">{eyebrow}</div>
          <h1
            className="tf-display"
            style={{ fontSize: 'clamp(40px, 4.4vw, 60px)', marginTop: 16 }}
          >
            {title}
          </h1>
          {intro && (
            <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.65, marginTop: 24, maxWidth: '62ch' }}>
              {intro}
            </p>
          )}
        </div>
      </section>
      <section style={{ padding: '8px 0 80px' }}>
        <div className="tf-container" style={{ maxWidth: 880 }}>
          {children}
        </div>
      </section>
    </main>
  );
}

// ─── Pricing ───────────────────────────────────────────────────
export function Pricing() {
  const navigate = useNavigate();
  return (
    <PageShell
      eyebrow="Pricing"
      title={<>Free for bidders. <em>Always.</em></>}
      intro="TenderFlow is free for SMEs and bidders. We make money from suppliers who want premium analytics and from buyers who pay to feature their tenders. Browsing and the digest are free, forever."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginTop: 24
        }}
      >
        {[
          {
            name: 'Free',
            price: 'KES 0',
            blurb: 'For bidders, always.',
            features: ['Browse all live tenders', 'Search + filter', 'Weekly digest', 'Save to watchlist'],
            cta: 'Get started',
            action: () => navigate('/digest')
          },
          {
            name: 'Pro',
            price: 'KES 2,500/mo',
            blurb: 'For active bidders.',
            features: ['Everything in Free', 'Daily digest', 'AI bid-readiness score', 'Saved searches + alerts'],
            cta: 'Coming soon',
            action: () => alert('Pro plan launches Q3 2026,get the digest to be notified.')
          },
          {
            name: 'Enterprise',
            price: 'Talk to us',
            blurb: 'For consultancies & teams.',
            features: ['Multi-seat access', 'Custom feeds', 'API access', 'Dedicated support'],
            cta: 'Contact sales',
            action: () => navigate('/contact')
          }
        ].map(t => (
          <div key={t.name} style={{ padding: 24, background: 'var(--paper)', border: '1px solid var(--rule)' }}>
            <div className="tf-eyebrow">{t.name}</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 32, color: 'var(--navy)', marginTop: 8, fontWeight: 500 }}>{t.price}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t.blurb}</p>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 16, fontSize: 14, lineHeight: 1.8 }}>
              {t.features.map(f => <li key={f}>· {f}</li>)}
            </ul>
            <button className="tf-cta" style={{ marginTop: 16, width: '100%' }} onClick={t.action}>{t.cta}</button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

// ─── Submit a tender ───────────────────────────────────────────
export function SubmitTender() {
  const [form, setForm] = useState({ name: '', org: '', email: '', tender_url: '', notes: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function send(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('tender_submissions').insert(form);
      if (error) {
        setError(error.message);
        setSubmitting(false);
        return;
      }
    }
    setSent(true);
    setSubmitting(false);
  }

  return (
    <PageShell
      eyebrow="Submit a tender"
      title="Got a tender we should know about?"
      intro="Send us a link or upload a PDF and we'll add it to the feed. Especially useful for buyers publishing under-the-radar opportunities or bidders who spotted something we missed."
    >
      {sent ? (
        <div style={{ padding: 24, background: 'var(--paper)', border: '1px solid var(--rule)', maxWidth: 540 }}>
          <div className="tf-eyebrow" style={{ color: 'var(--gold)' }}>Got it.</div>
          <h3 style={{ fontFamily: 'var(--serif)', margin: '12px 0', fontSize: 22 }}>Thanks for the submission.</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>We'll review it within 1 working day. You'll hear from us if we have questions.</p>
        </div>
      ) : (
        <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 540 }}>
          <label className="tf-ob-label">
            <span className="tf-ob-label-text">Your name</span>
            <input className="tf-ob-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="tf-ob-label">
            <span className="tf-ob-label-text">Organisation</span>
            <input className="tf-ob-input" value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} />
          </label>
          <label className="tf-ob-label">
            <span className="tf-ob-label-text">Email</span>
            <input type="email" className="tf-ob-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="tf-ob-label">
            <span className="tf-ob-label-text">Tender URL or reference</span>
            <input className="tf-ob-input" value={form.tender_url} onChange={e => setForm({ ...form, tender_url: e.target.value })} />
          </label>
          <label className="tf-ob-label">
            <span className="tf-ob-label-text">Notes</span>
            <textarea className="tf-ob-input" rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </label>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          <button className="tf-cta" type="submit" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        </form>
      )}
    </PageShell>
  );
}

// ─── Contact ───────────────────────────────────────────────────
export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function send(e) {
    e.preventDefault();
    setError(null);
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('contact_messages').insert(form);
      if (error) { setError(error.message); return; }
    }
    setSent(true);
  }

  return (
    <PageShell
      eyebrow="Contact"
      title="Get in touch."
      intro="Questions, feedback, partnerships, press,all welcome. We respond within one working day."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--navy)', fontWeight: 500 }}>Direct</h3>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 14, lineHeight: 2 }}>
            <li>Email: <a href="mailto:hello@tenderflow.africa" style={{ color: 'var(--navy)' }}>hello@tenderflow.africa</a></li>
            <li>WhatsApp: <a href="https://wa.me/254704463612" target="_blank" rel="noopener" style={{ color: 'var(--navy)' }}>+254 704 463 612</a></li>
            <li>Office: Westlands, Nairobi · Lekki, Lagos</li>
          </ul>
        </div>
        <div>
          {sent ? (
            <div style={{ padding: 16, background: 'var(--paper)', border: '1px solid var(--rule)' }}>
              <div className="tf-eyebrow" style={{ color: 'var(--gold)' }}>Sent.</div>
              <p style={{ marginTop: 8 }}>We'll be in touch shortly.</p>
            </div>
          ) : (
            <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="tf-ob-input" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input type="email" className="tf-ob-input" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              <textarea className="tf-ob-input" rows={5} placeholder="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
              {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
              <button className="tf-cta" type="submit">Send</button>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────
const FAQS = [
  ['Is it really free?', 'Yes. Browsing tenders and the weekly digest are free for bidders, forever. We make money from suppliers paying for premium analytics and from featured-listing fees on the buyer side.'],
  ['Where do tenders come from?', 'Government portals, parastatal procurement boards, corporate vendor portals, gazette notices, and SME networks. We add new sources weekly. Submit a tender we should cover via the Submit page.'],
  ['How fast are tenders indexed?', 'Most appear within 24 hours of publication. Closing-soon tenders are reviewed twice daily.'],
  ['Can I submit a tender myself?', 'Yes,anyone can suggest a tender via the Submit a tender page. Our team verifies before publishing.'],
  ['What countries do you cover?', 'Currently 14 countries across East, West and Southern Africa, with more being added based on demand.']
];
export function FAQ() {
  return (
    <PageShell eyebrow="FAQ" title="Frequently asked questions">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {FAQS.map(([q, a]) => (
          <details
            key={q}
            style={{ padding: '20px 0', borderBottom: '1px solid var(--rule)' }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontFamily: 'var(--serif)',
                fontSize: 20,
                color: 'var(--navy)',
                fontWeight: 500,
                listStyle: 'none'
              }}
            >
              {q}
            </summary>
            <p style={{ marginTop: 12, color: 'var(--ink)', lineHeight: 1.65 }}>{a}</p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}

// ─── Glossary ──────────────────────────────────────────────────
const TERMS = [
  ['BoQ', 'Bill of Quantities,itemised list of materials, parts, and labour for a tender.'],
  ['eGP', 'Electronic Government Procurement,Kenya\'s online procurement portal at egpkenya.go.ke.'],
  ['EOI', 'Expression of Interest,first-stage filter to identify shortlisted bidders.'],
  ['ITT', 'Invitation to Tender,formal request to suppliers to submit a bid.'],
  ['RFP', 'Request for Proposal,solicitation for proposals, common in private-sector procurement.'],
  ['RFQ', 'Request for Quotation,request for price quotes on standardised goods.'],
  ['SME', 'Small and Medium Enterprise,businesses below thresholds defined per country.']
];
export function Glossary() {
  return (
    <PageShell eyebrow="Glossary" title="Tender terms, plain English." intro="The acronyms and jargon that show up in tender documents,explained without procurement-speak.">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
        <tbody>
          {TERMS.map(([t, d]) => (
            <tr key={t} style={{ borderBottom: '1px solid var(--rule-soft)' }}>
              <td style={{ padding: '14px 0', width: 100, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--gold)' }}>{t}</td>
              <td style={{ padding: '14px 0', color: 'var(--ink)' }}>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PageShell>
  );
}

// ─── Generic info pages ────────────────────────────────────────
export function Guide() {
  return (
    <PageShell
      eyebrow="Bid-writing guide"
      title="Win more tenders. Spend less time on each one."
      intro="A working guide for SME bidders,distilled from hundreds of real tender outcomes."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 24 }}>
        {[
          ['Read the eligibility section first', 'Most disqualifications happen at this stage. Tax compliance, registration documents, financial thresholds,verify before writing a single line.'],
          ['Check the submission method twice', 'Emailed bids when sealed copies were required get rejected unread. The submission method is non-negotiable.'],
          ['Match the BoQ exactly', 'Use the buyer\'s line items and units. Don\'t reorder. Don\'t omit. Add a separate sheet if you need to clarify.'],
          ['Quote with confidence', 'Underbidding to win is a trap,you lose money on delivery. Calculate a target margin, then bid above your floor, not the buyer\'s ceiling.']
        ].map(([h, b]) => (
          <div key={h}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--navy)', fontWeight: 500, margin: 0 }}>{h}</h3>
            <p style={{ marginTop: 8, color: 'var(--ink)', lineHeight: 1.65 }}>{b}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function Press() {
  return (
    <PageShell eyebrow="Press" title="Press & media" intro="For interviews, brand assets or partnership inquiries, email press@tenderflow.africa.">
      <p style={{ color: 'var(--muted)' }}>
        Brand assets and a one-pager are available on request. We respond within one working day.
      </p>
    </PageShell>
  );
}

export function Privacy() {
  return (
    <PageShell eyebrow="Privacy" title="Privacy policy" intro="Last updated: April 2026.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, lineHeight: 1.65, color: 'var(--ink)' }}>
        <p>We collect only the information needed to run TenderFlow: your email if you subscribe to a digest, and basic usage analytics that help us improve the product. We do not sell or share your email.</p>
        <p>You can unsubscribe at any time. To delete your data, email <a href="mailto:privacy@tenderflow.africa" style={{ color: 'var(--navy)' }}>privacy@tenderflow.africa</a>.</p>
        <p>For full details on how Supabase (our database provider) handles data, see <a href="https://supabase.com/privacy" target="_blank" rel="noopener" style={{ color: 'var(--navy)' }}>supabase.com/privacy</a>.</p>
      </div>
    </PageShell>
  );
}

export function Terms() {
  return (
    <PageShell eyebrow="Terms" title="Terms of service" intro="Last updated: April 2026.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, lineHeight: 1.65, color: 'var(--ink)' }}>
        <p>TenderFlow aggregates publicly available tender notices and provides them in a searchable feed. We do our best to verify accuracy, but you should always confirm details with the official issuing authority before acting.</p>
        <p>You may use TenderFlow free of charge for personal or commercial bidding research. You may not scrape, resell, or republish our data without permission.</p>
        <p>We provide the service "as is" and are not liable for missed deadlines or commercial decisions made based on information from the platform.</p>
      </div>
    </PageShell>
  );
}

export function Cookies() {
  return (
    <PageShell eyebrow="Cookies" title="Cookie policy">
      <p style={{ lineHeight: 1.65, color: 'var(--ink)' }}>
        We use a single first-party cookie set by Supabase to keep you signed in. We do not use advertising cookies, tracking pixels, or third-party analytics that share data with marketers.
      </p>
    </PageShell>
  );
}

// Generic 404
export function NotFound() {
  return (
    <PageShell eyebrow="404" title="This page doesn't exist." intro="The link you followed may be broken, or the page may have been moved.">
      <Link to="/" className="tf-cta" style={{ display: 'inline-block', textDecoration: 'none' }}>Back to home</Link>
    </PageShell>
  );
}
