import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import PageHero from '../components/PageHero.jsx';

function PageShell({ eyebrow, title, intro, children }) {
  return (
    <main className="tf-page-anim">
      <PageHero eyebrow={eyebrow} title={title} subtitle={intro} />
      <section style={{ padding: '48px 0 72px', background: 'var(--paper)' }}>
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
      intro="Questions, feedback, partnerships, press, all welcome. We respond within one working day."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--navy)', fontWeight: 500, marginTop: 0 }}>
            Direct
          </h3>
          {/* Contact items: icon-only headers (no text labels), modern
             larger value text. The icons are universally understood
             (envelope, phone, pin). Alternative email block removed. */}
          <div className="tf-contact-grid">
            <a href="mailto:help@tenderflow.co.ke" className="tf-contact-item">
              <span className="tf-contact-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M3 7l9 7 9-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="tf-contact-value">help@tenderflow.co.ke</span>
            </a>

            <a href="tel:+254724131492" className="tf-contact-item">
              <span className="tf-contact-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2 16 16 0 0 1-16-16 2 2 0 0 1 2-2z"
                    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="tf-contact-value">0724 131 492</span>
            </a>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Eden+Square+Complex+Chiromo+Road+Westlands+Nairobi"
              target="_blank"
              rel="noopener"
              className="tf-contact-item"
            >
              <span className="tf-contact-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  <circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                </svg>
              </span>
              <span className="tf-contact-value tf-contact-multiline">
                Eden Square Complex, Chiromo Road<br />
                Westlands, Block 1, 7th Floor<br />
                Nairobi, Kenya
              </span>
            </a>
          </div>

          {/* Social media row: icon-only circular links. Same brand-tinted
             hover treatment as the contact items above. aria-labels carry
             the platform name for screen readers. */}
          <div className="tf-contact-social" aria-label="TenderFlow on social media">
            <a
              href="https://www.linkedin.com/company/tenderflow-east-africa"
              target="_blank"
              rel="noopener"
              className="tf-contact-social-link"
              aria-label="TenderFlow on LinkedIn"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                  fill="currentColor"
                />
              </svg>
            </a>
            <a
              href="https://x.com/tenderflow_ea"
              target="_blank"
              rel="noopener"
              className="tf-contact-social-link"
              aria-label="TenderFlow on X"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"
                  fill="currentColor"
                />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/TenderFlowEastAfrica"
              target="_blank"
              rel="noopener"
              className="tf-contact-social-link"
              aria-label="TenderFlow on Facebook"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103.43.071.812.156 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12S0 5.417 0 12.044c0 5.628 3.874 10.35 9.101 11.647Z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </div>

          <p style={{ marginTop: 22, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            We respond to email within one working day. Phone lines are open
            Monday to Friday, 9am to 5pm East Africa Time.
          </p>
        </div>

        <div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--navy)', fontWeight: 500, marginTop: 0 }}>
            Send a message
          </h3>
          {sent ? (
            <div style={{ padding: 20, background: 'var(--paper)', border: '1px solid var(--rule)', borderLeft: '3px solid var(--gold)' }}>
              <div className="tf-eyebrow" style={{ color: 'var(--gold)' }}>Sent</div>
              <p style={{ marginTop: 8 }}>We'll be in touch shortly.</p>
            </div>
          ) : (
            <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
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
  ['Where do tenders come from?', 'Government portals, parastatal procurement boards, county procurement notices, NGO bulletins, donor-funded project announcements, and SME networks. We add new sources weekly. Submit a tender we should cover via the Submit page.'],
  ['How fast are tenders indexed?', 'Most appear within 24 hours of publication. Closing-soon tenders are reviewed twice daily.'],
  ['Can I submit a tender myself?', 'Yes, anyone can suggest a tender via the Submit a tender page. Our team verifies before publishing.'],
  ['What countries do you cover?', 'Kenya, Uganda and Tanzania. We started with East Africa because the three economies share procurement rules, time zones, and bidder networks. The rest of the continent follows as we gain traction.']
];
// FAQPage JSON-LD: lets Google render these Q&As as expandable rich
// snippets directly in search results. Big real estate win because the
// snippet pushes competitors further down the page even when we rank
// below them. Generated from the same FAQS array the page renders.
const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'inLanguage': 'en-KE',
  'mainEntity': FAQS.map(([q, a]) => ({
    '@type': 'Question',
    'name': q,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': a
    }
  }))
};

export function FAQ() {
  return (
    <PageShell eyebrow="FAQ" title="Frequently asked questions">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
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
    <PageShell eyebrow="Press" title="Press & media" intro="For interviews, brand assets or partnership inquiries, email press@tenderflow.co.ke.">
      <p style={{ color: 'var(--muted)' }}>
        Brand assets and a one-pager are available on request. We respond within one working day.
      </p>
    </PageShell>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--navy)', fontWeight: 500, margin: '0 0 10px' }}>{title}</h3>
      <div style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.65 }}>{children}</div>
    </section>
  );
}

export function Privacy() {
  return (
    <PageShell eyebrow="Privacy" title="Privacy policy" intro="Last updated: May 2026. We take the trust of bidders, buyers, and consultants seriously. Here is exactly what we collect, why, and the controls you have.">
      <Section title="Who we are">
        <p>
          TenderFlow is an independent tender-intelligence service based in
          Nairobi, Kenya. We consolidate live procurement opportunities from
          across East Africa into one searchable feed: every government, NGO,
          and SME tender, structured, indexed, and easy to act on. Where most
          listing services cover a single ministry or a single country, we
          bring the region together so bidders find the work that fits them
          without hunting across twenty portals.
        </p>
        <p style={{ marginTop: 12 }}>
          In this policy, "TenderFlow", "we", "us" and "our" mean the
          TenderFlow team operating tenderflow.co.ke (and any custom domain
          we publish on). Contact:{' '}
          <a href="mailto:help@tenderflow.co.ke" style={{ color: 'var(--navy)' }}>
            help@tenderflow.co.ke
          </a>.
        </p>
      </Section>

      <Section title="What we collect">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li><strong>Account data:</strong> your email, name, and a hashed password (Supabase Auth handles password hashing; we never see your password in plain text).</li>
          <li><strong>Consultant data:</strong> if you register as a consultant, additionally your phone number, biography, sectors and countries of expertise, profile photo, and CV.</li>
          <li><strong>Activity data:</strong> tenders you save to your watchlist, hire requests you submit, and checklist progress on your device.</li>
          <li><strong>Diagnostic data:</strong> standard server logs (IP, user agent, timestamp) for security and abuse prevention. Retained 30 days.</li>
        </ul>
      </Section>

      <Section title="What we do not collect">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>We do not use third-party advertising trackers or pixels.</li>
          <li>We do not use cross-site analytics that share your behaviour with marketers.</li>
          <li>We do not sell your data. Ever. To anyone.</li>
        </ul>
      </Section>

      <Section title="Why we use it">
        <p>To deliver the service: authenticate you, show you tenders that match your interests, deliver the digest you opt into, match you with consultants when you hire one, and keep the platform secure. We process data on the legal basis of the contract you enter into with us by creating an account.</p>
      </Section>

      <Section title="Where it lives">
        <p>Your data is stored in Supabase (PostgreSQL) hosted in the EU region, and on Vercel's edge network for static assets. PDFs you upload, profile photos, and CVs live in Supabase Storage with row-level security policies that prevent other users from accessing your private files.</p>
        <p>When you upload a tender document, the file is sent to Anthropic (Claude) for one-time field extraction. Anthropic does not retain or train on data sent through the API, per their <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener" style={{ color: 'var(--navy)' }}>privacy commitments</a>. The original document is then stored only in our Supabase Storage bucket.</p>
      </Section>

      <Section title="Who can see what">
        <p>Public tenders are visible to everyone. Your watchlist, hire requests, and consultant draft profile are visible only to you and TenderFlow admins. Approved consultant profiles (name, bio, photo, sectors, ratings) are visible publicly so bidders can find you. Your email and phone are NEVER shown publicly even when your consultant profile is approved, only revealed to bidders who explicitly hire you.</p>
      </Section>

      <Section title="Your rights">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li><strong>Access:</strong> download a copy of everything we hold on you. Email us.</li>
          <li><strong>Correction:</strong> edit your profile and consultant details any time from your dashboard.</li>
          <li><strong>Deletion:</strong> close your account and we erase your data within 30 days, except where we have a legal obligation to retain certain records (e.g. tax records on completed paid engagements).</li>
          <li><strong>Portability:</strong> your data is exportable as JSON on request.</li>
          <li><strong>Objection:</strong> opt out of the digest at any time. Marketing communications are opt-in by default.</li>
        </ul>
        <p style={{ marginTop: 10 }}>Send any request to <a href="mailto:privacy@tenderflow.co.ke" style={{ color: 'var(--navy)' }}>privacy@tenderflow.co.ke</a>. We respond within 5 working days.</p>
      </Section>

      <Section title="Cookies and storage">
        <p>We use one first-party cookie set by Supabase Auth to keep you signed in. Tender checklist progress is stored in your browser's localStorage. We do not use third-party tracking cookies.</p>
      </Section>

      <Section title="Children">
        <p>TenderFlow is not directed at children under 16 and we do not knowingly collect data from them.</p>
      </Section>

      <Section title="Changes to this policy">
        <p>If we materially change this policy, we will notify registered users by email at least 14 days before the change takes effect. The "Last updated" date at the top reflects the most recent revision.</p>
      </Section>
    </PageShell>
  );
}

export function Terms() {
  return (
    <PageShell eyebrow="Terms" title="Terms of service" intro="Last updated: May 2026. These terms govern your use of TenderFlow. Plain English, no surprises.">
      <Section title="The service">
        <p>TenderFlow aggregates publicly available tender notices, applies AI extraction to surface the fields that matter (issuer, value, deadlines, requirements), and lets bidders save them, generate checklists, and hire consultants. We do our best to verify accuracy, but you should always confirm details with the official issuing authority before acting.</p>
      </Section>
      <Section title="Your account">
        <p>You are responsible for keeping your password safe and for activity that happens under your account. Tell us immediately if you suspect unauthorised access. You may not create accounts for someone else or impersonate any person or organisation.</p>
      </Section>
      <Section title="Acceptable use">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Free for personal or commercial bidding research.</li>
          <li>Do not scrape, redistribute, or republish our data without written permission.</li>
          <li>Do not use the platform to harass other users, post misleading information, or upload material you do not have the right to share.</li>
          <li>Consultants must represent their experience accurately. We may remove profiles that misrepresent.</li>
        </ul>
      </Section>
      <Section title="Consultants and hiring">
        <p>When a bidder hires a consultant through TenderFlow, the contract is between the bidder and the consultant. TenderFlow facilitates the introduction but is not a party to the engagement. Fees, deliverables, and dispute resolution are between the two parties. We may charge a platform fee on completed engagements; that fee will always be disclosed before you proceed.</p>
      </Section>
      <Section title="Liability">
        <p>We provide the service "as is". We are not liable for missed deadlines, lost bids, or commercial decisions made based on information from the platform. We do not guarantee that the AI-extracted fields are perfectly accurate; you must verify against the original tender document.</p>
      </Section>
      <Section title="Termination">
        <p>You may close your account at any time. We may suspend or close accounts that violate these terms, with notice where possible.</p>
      </Section>
      <Section title="Governing law">
        <p>These terms are governed by the laws of Kenya. Disputes will be handled in the courts of Nairobi.</p>
      </Section>
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
