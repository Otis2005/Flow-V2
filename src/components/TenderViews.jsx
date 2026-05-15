import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';
import AgpoBadge from './AgpoBadge.jsx';
import CountryFlag from './CountryFlag.jsx';
import { daysUntil, fmtDate } from '../lib/format.js';

function formatBidSecurity(t) {
  if (t.bid_security && t.bid_security.trim()) return t.bid_security;
  if (t.bidSecurity && t.bidSecurity.trim()) return t.bidSecurity;
  return 'Not Required';
}

export function TenderCard({ tender }) {
  const days = daysUntil(tender.closes);
  const bs = formatBidSecurity(tender);
  const noneNeeded = /not\s*required|none|n\/?a/i.test(bs);
  const logoUrl = tender.issuer_logo_url || tender.issuerLogoUrl;
  return (
    <Link to={`/tenders/${tender.id}`} style={{ textDecoration: 'none' }}>
      <article className={'tf-card' + (logoUrl ? ' has-logo' : '')}>
        {logoUrl && (
          <div
            className="tf-card-logo"
            style={{ backgroundImage: `url(${logoUrl})` }}
            aria-hidden="true"
          />
        )}
        <div className="tf-card-inner">
          <div className="tf-card-meta-top">
            <div className="tf-card-issuer">
              <div className="tf-card-issuer-name">{tender.issuer}</div>
              <div className="tf-card-country-row">
                <CountryFlag country={tender.country} />
                <span>{tender.country} · {tender.sector}</span>
              </div>
            </div>
            <div className="tf-card-badges">
              <Badge source={tender.source} />
              {(tender.agpo_category || tender.agpoCategory) && (
                <AgpoBadge category={tender.agpo_category || tender.agpoCategory} />
              )}
            </div>
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
          {(tender.download_count > 0) && (
            <div className="tf-card-bids" title={`${tender.download_count} document download${tender.download_count === 1 ? '' : 's'}`}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 2v9m-3-3 3 3 3-3M3 13h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <strong style={{ fontWeight: 700 }}>{tender.download_count}</strong>&nbsp;Interest
            </div>
          )}
        </div>
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
