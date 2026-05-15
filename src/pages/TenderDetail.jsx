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

export default function TenderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tender, loading } = useTender(id);
  const { tenders } = useTenders();
  const { user } = useAuth();
  const [savedToast, setSavedToast] = useState(null);
  const [onWatchlist, setOnWatchlist] = useState(false);

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

  // Local mirror of the bid count so the UI updates immediately when a
  // user downloads a doc, without re-fetching the tender row.
  const [bidCount, setBidCount] = useState(null);
  useEffect(() => {
    setBidCount(tender?.download_count ?? 0);
  }, [tender?.id, tender?.download_count]);

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

  return (
    <main className="tf-page-anim">
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
                <strong style={{ fontWeight: 700 }}>{bidCount}</strong>&nbsp;Interest
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

          <FadeIn className="tf-detail-section">
            <h3>Key dates</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {[
                  ['Tender published', fmtDate(tender.published)],
                  ['Bid submission deadline', fmtDate(tender.closes)]
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--rule-soft)' }}>
                    <td style={{ padding: '12px 0', color: 'var(--muted)', width: '45%' }}>{k}</td>
                    <td style={{ padding: '12px 0', fontWeight: 500 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FadeIn>

          {Array.isArray(tender.documents) && tender.documents.length > 0 && (
            <FadeIn className="tf-detail-section">
              <h3>Tender documents</h3>
              <ul className="tf-doc-list">
                {tender.documents.map((d, i) => (
                  <li
                    key={d.name + i}
                    className="tf-doc"
                    onClick={() => handleDownload(d)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="tf-doc-name">
                      <span className="tf-doc-icon"></span>
                      {d.name}
                    </span>
                    <span style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                      {d.size && <span className="tf-doc-size">{d.size}</span>}
                      <span style={{ color: 'var(--navy)', fontSize: 13, fontWeight: 600 }}>Download →</span>
                    </span>
                  </li>
                ))}
              </ul>
            </FadeIn>
          )}

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
              <button
                className="tf-cta"
                style={{ width: '100%' }}
                onClick={() => {
                  if (tender.documents?.[0]) handleDownload(tender.documents[0]);
                  else setSavedToast('No documents attached yet.');
                }}
              >
                Download tender pack
              </button>
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
