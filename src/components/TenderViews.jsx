import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';
import { Stars } from './StarRating.jsx';
import { daysUntil, fmtDate } from '../lib/format.js';

function formatBidSecurity(t) {
  // Either an explicit string ("USD 50,000", "Not Required") or fall back to
  // showing the estimated value if no bid security is set.
  if (t.bid_security && t.bid_security.trim()) return t.bid_security;
  if (t.bidSecurity && t.bidSecurity.trim()) return t.bidSecurity;
  return 'Not Required';
}

export function TenderCard({ tender }) {
  const days = daysUntil(tender.closes);
  const bs = formatBidSecurity(tender);
  const noneNeeded = /not\s*required|none|n\/?a/i.test(bs);
  return (
    <Link to={`/tenders/${tender.id}`} style={{ textDecoration: 'none' }}>
      <article className="tf-card">
        <div className="tf-card-meta-top">
          <div className="tf-card-issuer">
            <div>{tender.issuer}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
              {tender.country} · {tender.sector}
            </div>
          </div>
          <Badge source={tender.source} />
        </div>
        <h3 className="tf-card-title">{tender.title}</h3>
        <p className="tf-card-summary">{tender.summary}</p>
        <div className="tf-card-foot">
          <div className="tf-card-foot-l">
            <span>
              <div className="tf-card-foot-label">Bid security</div>
              <div className={'tf-card-foot-val' + (noneNeeded ? ' bid-security-none' : '')}>
                {bs}
              </div>
            </span>
          </div>
          <span>
            <div className="tf-card-foot-label" style={{ textAlign: 'right' }}>Closes in</div>
            <div className={'tf-card-deadline' + (days <= 14 ? ' is-urgent' : '')}>
              {days} days · {fmtDate(tender.closes)}
            </div>
          </span>
        </div>
        {(tender.issuer_rating != null || tender.issuerRating != null) && (
          <div className="tf-card-rating">
            <Stars value={tender.issuer_rating ?? tender.issuerRating} />
          </div>
        )}
      </article>
    </Link>
  );
}

export function TenderRow({ tender }) {
  const days = daysUntil(tender.closes);
  const bs = formatBidSecurity(tender);
  return (
    <Link to={`/tenders/${tender.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="tf-row">
        <Badge source={tender.source} />
        <div>
          <div className="tf-row-title">{tender.title}</div>
          <div className="tf-row-issuer">{tender.issuer} · {tender.country} · {tender.sector}</div>
        </div>
        <div className="tf-row-cell">
          <div className="tf-row-cell-label">Bid security</div>
          <strong>{bs}</strong>
        </div>
        <div className="tf-row-cell">
          <div className="tf-row-cell-label">Closes</div>
          <strong>{fmtDate(tender.closes)}</strong>
        </div>
        <div className="tf-row-cell">
          <div className="tf-row-cell-label">In</div>
          <strong style={{ color: days <= 14 ? 'var(--danger)' : 'var(--navy)' }}>{days} days</strong>
        </div>
        <div className="tf-row-arrow">→</div>
      </div>
    </Link>
  );
}

export function TenderTable({ tenders }) {
  return (
    <table className="tf-table">
      <thead>
        <tr>
          <th>Source</th>
          <th>Title / Issuer</th>
          <th>Sector</th>
          <th>Country</th>
          <th>Bid security</th>
          <th>Closes</th>
          <th className="tf-table-num">Days left</th>
        </tr>
      </thead>
      <tbody>
        {tenders.map(t => {
          const days = daysUntil(t.closes);
          return (
            <tr key={t.id}>
              <td><Badge source={t.source} /></td>
              <td>
                <Link to={`/tenders/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="tf-table-title">{t.title}</div>
                  <div className="tf-table-issuer">{t.issuer}</div>
                </Link>
              </td>
              <td>{t.sector}</td>
              <td>{t.country}</td>
              <td>{formatBidSecurity(t)}</td>
              <td>{fmtDate(t.closes)}</td>
              <td
                className="tf-table-num"
                style={{ color: days <= 14 ? 'var(--danger)' : 'var(--ink)', fontWeight: 600 }}
              >
                {days}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
