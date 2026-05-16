import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import CountryFlag from '../components/CountryFlag.jsx';
import FadeIn from '../components/FadeIn.jsx';
import { TenderCard } from '../components/TenderViews.jsx';
import { useTender, useTenders } from '../lib/useTenders.js';
import { daysUntil, fmtDate, fmtValue } from '../lib/format.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { useAuth } from '../lib/AuthProvider.jsx';
import TenderChecklist from '../components/TenderChecklist.jsx';

// Small helpers for file-type display. Used by the sidebar download
// zone to colour-code badges and label the primary button correctly
// (Download PDF / Download DOC / Download XLS, etc).
function docExtLabel(name) {
  const ext = (name || '').split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'doc' || ext === 'docx') return 'DOC';
  if (ext === 'xls' || ext === 'xlsx') return 'XLS';
  return ext.slice(0, 3).toUpperCase() || 'FILE';
}
function docExtTone(name) {
  const ext = (name || '').split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'doc';
  if (ext === 'xls' || ext === 'xlsx') return 'xls';
  return 'other';
}

export default function TenderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tender, loading } = useTender(id);
  const { tenders } = useTenders();
  const { user } = useAuth();
  const [savedToast, setSavedToast] = useState(null);
  const [onWatchlist, setOnWatchlist] = useState(false);
  // Local mirror of the bid count so the UI updates immediately when a
  // user downloads a doc, without re-fetching the tender row.
  // IMPORTANT: this hook must live at the top of the component, BEFORE
  // any early returns, or React's rules-of-hooks fire and the whole
  // page renders blank.
  const [bidCount, setBidCount] = useState(0);

  useEffect(() => {
    if (!tender) return;
    if (user && isSupabaseConfigured) {
      supabase
        .from('watchlist')
        .select('tender_id')
        .eq('user_id', user.id)
        .eq('tender_id', tender.id)
        .maybeSingle()
        .then(({ data }) => setOnWatchlist(Boolean(data)));
    } else {
      const list = JSON.parse(localStorage.getItem('tf-watchlist') || '[]');
      setOnWatchlist(list.includes(tender.id));
    }
  }, [tender, user]);

  useEffect(() => {
    setBidCount(tender?.download_count ?? 0);
  }, [tender?.id, tender?.download_count]);

  if (loading) {
    return (
      <main className="tf-container" style={{ padding: '120px 0', textAlign: 'center' }}>
        <div className="tf-eyebrow">Loading tender…</div>
      </main>
    );
  }

  if (!tender) {
    return (
      <main className="tf-container" style={{ padding: '120px 0', maxWidth: 640 }}>
        <div className="tf-eyebrow tf-eyebrow-rule">Not found</div>
        <h1 className="tf-section-title" style={{ marginTop: 12 }}>This tender does not exist or has been removed.</h1>
        <button className="tf-cta" onClick={() => navigate('/tenders')} style={{ marginTop: 24 }}>Back to all tenders</button>
      </main>
    );
  }

  const days = daysUntil(tender.closes);
  const bidSecurity = tender.bid_security && tender.bid_security.trim() ? tender.bid_security : 'Not Required';

  // Similar tenders, latest uploaded first (by created_at, which is when
  // the admin uploaded to TenderFlow — falls back to published_at if
  // created_at is missing, which happens with sample data).
  const related = tenders
    .filter(t => t.id !== tender.id && (t.sector === tender.sector || t.country === tender.country))
    .sort((a, b) =>
      new Date(b.created_at || b.published) - new Date(a.created_at || a.published)
    )
    .slice(0, 3);

  async function trackDownload() {
    if (!isSupabaseConfigured || !tender?.id) return;
    try {
      const { data, error } = await supabase
        .rpc('increment_tender_download', { p_tender_id: tender.id });
      if (!error && typeof data === 'number') {
        setBidCount(data);
      }
    } catch (e) {
      // Counter is best-effort; never block the actual download.
      console.warn('[tender] download counter failed', e);
    }
  }

  async function handleDownload(doc) {
    if (!doc.url && !doc.storage_path) {
      setSavedToast('Original document not yet attached. Contact admin.');
      setTimeout(() => setSavedToast(null), 3000);
      return;
    }
    // Fire-and-forget the counter increment alongside the actual download.
    trackDownload();
    if (doc.url) {
      window.open(doc.url, '_blank', 'noopener');
      return;
    }
    if (isSupabaseConfigured && doc.storage_path) {
      const { data, error } = await supabase.storage
        .from('tender-pdfs')
        .createSignedUrl(doc.storage_path, 60 * 60);
      if (error) {
        setSavedToast('Could not generate download link.');
        setTimeout(() => setSavedToast(null), 3000);
        return;
      }
      window.open(data.signedUrl, '_blank', 'noopener');
    }
  }

  async function handleSaveWatchlist() {
    if (user && isSupabaseConfigured) {
      if (onWatchlist) {
        await supabase.from('watchlist').delete().eq('user_id', user.id).eq('tender_id', tender.id);
        setOnWatchlist(false);
        setSavedToast('Removed from watchlist.');
      } else {
        await supabase.from('watchlist').insert({ user_id: user.id, tender_id: tender.id });
        setOnWatchlist(true);
        setSavedToast('Saved to watchlist.');
      }
    } else {
      const list = JSON.parse(localStorage.getItem('tf-watchlist') || '[]');
      if (list.includes(tender.id)) {
        const next = list.filter(x => x !== tender.id);
        localStorage.setItem('tf-watchlist', JSON.stringify(next));
        setOnWatchlist(false);
        setSavedToast('Removed from watchlist.');
      } else {
        localStorage.setItem('tf-watchlist', JSON.stringify([...list, tender.id]));
        setOnWatchlist(true);
        setSavedToast('Saved locally. Sign up to sync across devices.');
      }
    }
    setTimeout(() => setSavedToast(null), 3000);
  }

  // BreadcrumbList JSON-LD: Home > Tenders > [Country] > [This tender].
  // Helps Google understand the hierarchy and is the main signal for
  // earning sitelinks on brand-name queries. Each ListItem must be a
  // canonical absolute URL.
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://tenderflow.co.ke/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Tenders', 'item': 'https://tenderflow.co.ke/tenders' },
      { '@type': 'ListItem', 'position': 3, 'name': tender.country || 'Kenya', 'item': `https://tenderflow.co.ke/tenders?country=${encodeURIComponent(tender.country || 'Kenya')}` },
      { '@type': 'ListItem', 'position': 4, 'name': tender.title, 'item': `https://tenderflow.co.ke/tenders/${tender.id}` }
    ]
  };

  return (
    <main className="tf-page-anim">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="tf-detail-head">
        {tender.issuer_logo_url && (
          <div
            className="tf-detail-logo-backdrop"
            style={{ backgroundImage: `url(${tender.issuer_logo_url})` }}
          />
        )}
        <div className="tf-container">
          <div className="tf-detail-back" onClick={() => navigate('/tenders')}>← Back to all tenders</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
            <Badge source={tender.source} />
            <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Ref: {tender.refNo}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>· Published {fmtDate(tender.published)}</span>
            {bidCount > 0 && (
              <span className="tf-bids-pill" title={`${bidCount} document download${bidCount === 1 ? '' : 's'}`}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M8 2v9m-3-3 3 3 3-3M3 13h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <strong style={{ fontWeight: 700 }}>{bidCount}</strong>
              </span>
            )}
          </div>
          <h1 className="tf-detail-title">{tender.title}</h1>
          <div className="tf-detail-issuer" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <strong>{tender.issuer}</strong>
            <span>·</span>
            <CountryFlag country={tender.country} size="md" />
            <span>{tender.country}</span>
            <span>·</span>
            <span>{tender.sector}</span>
          </div>

          {/* Discoverable consultant CTA: subtle gold-trimmed chip inline
             with the header metadata. Sits on the navy band so the gold
             border + soft fill read as a "complimentary option" rather
             than a pushy banner. The full hire card in the sidebar still
             carries the longer value prop for anyone who wants detail. */}
          <button
            type="button"
            className="tf-consult-chip"
            onClick={() => navigate(`/hire?tender=${tender.id}`)}
            aria-label="Hire a consultant to help with this tender"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path
                d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 2c-3.3 0-5 1.7-5 4v2h10v-2c0-2.3-1.7-4-5-4Zm8 0c-.5 0-1 .05-1.46.13A5.7 5.7 0 0 1 16 15v2h4v-2c0-2.3-1.7-4-6-4Z"
                fill="currentColor"
              />
            </svg>
            <span>
              Don't have time? <strong>Get a vetted consultant</strong>
            </span>
            <span className="tf-consult-chip-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className="tf-container tf-detail-grid">
        <div>
          <FadeIn className="tf-detail-section">
            <h3>Summary</h3>
            <p>{tender.summary}</p>
          </FadeIn>

          {tender.scope && (
            <FadeIn className="tf-detail-section">
              <h3>Scope of work</h3>
              <p>{tender.scope}</p>
            </FadeIn>
          )}

          {tender.eligibility && (
            <FadeIn className="tf-detail-section">
              <h3>Eligibility</h3>
              <p>{tender.eligibility}</p>
            </FadeIn>
          )}

          {/* Key dates: compact 2-up card grid replacing the old table.
             Closes card picks up a gold accent + urgent text when the
             deadline is inside 14 days so it visually pops. */}
          <FadeIn className="tf-detail-section tf-detail-section-tight">
            <h3>Key dates</h3>
            <div className="tf-dates-grid">
              <div className="tf-date-card">
                <div className="tf-date-card-label">Published</div>
                <div className="tf-date-card-value">{fmtDate(tender.published)}</div>
              </div>
              <div className={'tf-date-card tf-date-card-deadline' + (days <= 14 ? ' is-urgent' : '')}>
                <div className="tf-date-card-label">Closes</div>
                <div className="tf-date-card-value">{fmtDate(tender.closes)}</div>
                <div className="tf-date-card-count">
                  {days >= 0 ? `${days} day${days === 1 ? '' : 's'} · 14:00 local` : 'Closed'}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Tender documents body section removed. All downloads now
             live in the right sidebar as a single canonical zone:
             primary doc = the big "Download PDF" button; additional
             docs = compact rows beneath it. See the aside block. */}

          <TenderChecklist tender={tender} user={user} />
        </div>

        <aside>
          <div className="tf-detail-keyfacts">
            <div className="tf-detail-keyfacts-head">
              <div className="tf-eyebrow" style={{ color: 'var(--gold-soft)' }}>Closes</div>
              <div className="tf-detail-deadline">{fmtDate(tender.closes)}</div>
              <div className="tf-detail-countdown">
                {days} days · 14:00 local time
              </div>
            </div>
            <dl>
              <dt>Bid security</dt>
              <dd>{bidSecurity}</dd>
              <dt>Estimated value</dt>
              <dd>{fmtValue(tender.value, tender.currency)}</dd>
              <dt>Source type</dt>
              <dd><Badge source={tender.source} /></dd>
              <dt>Country</dt>
              <dd>{tender.country}</dd>
              <dt>Sector</dt>
              <dd>{tender.sector}</dd>
              {tender.submission && (
                <>
                  <dt>Submission method</dt>
                  <dd>{tender.submission}</dd>
                </>
              )}
              <dt>Reference number</dt>
              <dd style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{tender.refNo}</dd>
            </dl>
            <div style={{ padding: '16px 22px 22px', borderTop: '1px solid var(--rule)' }}>
              {/* Canonical download zone for this tender.
                 - Primary doc (documents[0]) renders as the big PDF
                   button: file-type glyph + label + size + filename.
                 - Additional docs (documents[1..]) render as compact
                   rows directly below: small file-type badge + name +
                   size + down-arrow that nudges on hover.
                 No redundant body section, no scroll-to-anchor link;
                 this is the one place to download anything attached
                 to the tender. */}
              {tender.documents?.[0] ? (
                <>
                  <button
                    className="tf-cta tf-sidebar-pdf"
                    onClick={() => handleDownload(tender.documents[0])}
                  >
                    <span className="tf-sidebar-pdf-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path
                          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 7V3.5L19.5 9H14Z"
                          fill="currentColor"
                        />
                        <text
                          x="12" y="17"
                          textAnchor="middle"
                          fontSize="6.5"
                          fontWeight="700"
                          fontFamily="Helvetica, Arial, sans-serif"
                          fill="var(--navy)"
                        >
                          {docExtLabel(tender.documents[0].name)}
                        </text>
                      </svg>
                    </span>
                    <span className="tf-sidebar-pdf-text">
                      <span className="tf-sidebar-pdf-label">
                        Download {docExtLabel(tender.documents[0].name)}
                      </span>
                      <span className="tf-sidebar-pdf-meta">
                        {tender.documents[0].size || ''}
                        {tender.documents[0].size && tender.documents[0].name ? ' · ' : ''}
                        {tender.documents[0].name && (
                          tender.documents[0].name.length > 26
                            ? tender.documents[0].name.slice(0, 24) + '…'
                            : tender.documents[0].name
                        )}
                      </span>
                    </span>
                    <span className="tf-sidebar-pdf-arrow" aria-hidden="true">↓</span>
                  </button>

                  {tender.documents.length > 1 && (
                    <div className="tf-sidebar-docs-extra">
                      <div className="tf-sidebar-docs-extra-label">
                        + {tender.documents.length - 1} more
                      </div>
                      {tender.documents.slice(1).map((d, i) => {
                        const tone = docExtTone(d.name);
                        const label = docExtLabel(d.name);
                        return (
                          <button
                            key={d.name + i}
                            type="button"
                            className="tf-sidebar-doc-row"
                            onClick={() => handleDownload(d)}
                            title={`Download ${d.name}`}
                          >
                            <span className={`tf-sidebar-doc-badge is-${tone}`} aria-hidden="true">
                              {label}
                            </span>
                            <span className="tf-sidebar-doc-body">
                              <span className="tf-sidebar-doc-name">{d.name}</span>
                              {d.size && <span className="tf-sidebar-doc-size">{d.size}</span>}
                            </span>
                            <span className="tf-sidebar-doc-arrow" aria-hidden="true">↓</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <button
                  className="tf-cta"
                  style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                  disabled
                >
                  No document attached yet
                </button>
              )}
              <button
                className="tf-cta-ghost"
                style={{ width: '100%', marginTop: 8 }}
                onClick={handleSaveWatchlist}
              >
                {onWatchlist ? '✓ On your watchlist' : 'Save to watchlist'}
              </button>
              {savedToast && (
                <p style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                  {savedToast}
                </p>
              )}
            </div>
          </div>

          <div className="tf-hire-card">
            <h4>Need help with this tender?</h4>
            <p>
              Match with a vetted consultant who can prepare and submit your bid for you.
              Free to enquire, you only pay if you proceed.
            </p>
            <button
              className="tf-cta"
              onClick={() => navigate(`/hire?tender=${tender.id}`)}
            >
              Get this tender done for me →
            </button>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section style={{ padding: '32px 0 24px', borderTop: '1px solid var(--rule)', marginTop: 40 }}>
          <div className="tf-container">
            <FadeIn>
              <div className="tf-eyebrow tf-eyebrow-rule">Related</div>
              <h2 className="tf-section-title" style={{ marginTop: 12, marginBottom: 24 }}>Similar tenders</h2>
            </FadeIn>
            <div className="tf-cards-grid">
              {related.map((t, i) => (
                <FadeIn key={t.id} delay={i * 80}>
                  <TenderCard tender={t} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
