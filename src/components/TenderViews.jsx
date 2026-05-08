import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';
import { daysUntil, fmtDate, fmtValue } from '../lib/format.js';

export function TenderCard({ tender }) {
  const days = daysUntil(tender.closes);
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
              <div className="tf-card-foot-label">Value</div>
              <div className="tf-card-foot-val">{fmtValue(tender.value, tender.currency)}</div>
            </span>
          </div>
          <span>
            <div className="tf-card-foot-label" style={{ textAlign: 'right' }}>Closes in</div>
            <div className={'tf-card-deadline' + (days <= 14 ? ' is-urgent' : '')}>
              {days} days · {fmtDate(tender.closes)}
            </div>
          </span>
        </div>
      </article>
    </Link>
  );
}

export function TenderRow({ tender }) {
  const days = daysUntil(tender.closes);
  return (
    <Link to={`/tenders/${tender.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="tf-row">
        <Badge source={tender.source} />
        <div>
          <div className="tf-row-title">{tender.title}</div>
          <div className="tf-row-issuer">{tender.issuer} · {tender.country} · {tender.sector}</div>
        </div>
        <div className="tf-row-cell">
          <div className="tf-row-cell-label">Value</div>
          <strong>{fmtValue(tender.value, tender.currency)}</strong>
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
          <th className="tf-table-num">Value</th>
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
              <td className="tf-table-num">{fmtValue(t.value, t.currency)}</td>
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
