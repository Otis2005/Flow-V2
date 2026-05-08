import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import { TenderCard } from '../components/TenderViews.jsx';
import { useTender, useTenders } from '../lib/useTenders.js';
import { daysUntil, fmtDate, fmtValue } from '../lib/format.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

export default function TenderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tender, loading } = useTender(id);
  const { tenders } = useTenders();
  const [savedToast, setSavedToast] = useState(null);

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
        <h1 className="tf-section-title" style={{ marginTop: 12 }}>This tender doesn't exist or has been removed.</h1>
        <button className="tf-cta" onClick={() => navigate('/tenders')} style={{ marginTop: 24 }}>Back to all tenders</button>
      </main>
    );
  }

  const days = daysUntil(tender.closes);
  const related = tenders
    .filter(t => t.id !== tender.id && (t.sector === tender.sector || t.country === tender.country))
    .slice(0, 3);

  async function handleDownload(doc) {
    if (!doc.url && !doc.storage_path) {
      setSavedToast('Original document not yet attached. Contact admin.');
      setTimeout(() => setSavedToast(null), 3000);
      return;
    }
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

  function handleSaveWatchlist() {
    // Stored in localStorage so it works without account.
    const list = JSON.parse(localStorage.getItem('tf-watchlist') || '[]');
    if (list.includes(tender.id)) {
      setSavedToast('Already on your watchlist.');
    } else {
      localStorage.setItem('tf-watchlist', JSON.stringify([...list, tender.id]));
      setSavedToast('Saved to watchlist.');
    }
    setTimeout(() => setSavedToast(null), 3000);
  }

  return (
    <main>
      <div className="tf-detail-head">
        <div className="tf-container">
          <div className="tf-detail-back" onClick={() => navigate('/tenders')}>← Back to all tenders</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
            <Badge source={tender.source} />
            <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Ref: {tender.refNo}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>· Published {fmtDate(tender.published)}</span>
          </div>
          <h1 className="tf-detail-title">{tender.title}</h1>
          <div className="tf-detail-issuer">
            <strong>{tender.issuer}</strong> · {tender.country} · {tender.sector}
          </div>
        </div>
      </div>

      <div className="tf-container tf-detail-grid">
        <div>
          <div className="tf-detail-section">
            <h3>Summary</h3>
            <p>{tender.summary}</p>
          </div>

          {tender.scope && (
            <div className="tf-detail-section">
              <h3>Scope of work</h3>
              <p>{tender.scope}</p>
            </div>
          )}

          {tender.eligibility && (
            <div className="tf-detail-section">
              <h3>Eligibility</h3>
              <p>{tender.eligibility}</p>
            </div>
          )}

          <div className="tf-detail-section">
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
          </div>

          {Array.isArray(tender.documents) && tender.documents.length > 0 && (
            <div className="tf-detail-section">
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
            </div>
          )}
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
                Save to watchlist
              </button>
              {savedToast && (
                <p style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                  {savedToast}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section style={{ padding: '32px 0 24px', borderTop: '1px solid var(--rule)', marginTop: 40 }}>
          <div className="tf-container">
            <div className="tf-eyebrow tf-eyebrow-rule">Related</div>
            <h2 className="tf-section-title" style={{ marginTop: 12, marginBottom: 24 }}>Similar tenders</h2>
            <div className="tf-cards-grid">
              {related.map(t => <TenderCard key={t.id} tender={t} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
