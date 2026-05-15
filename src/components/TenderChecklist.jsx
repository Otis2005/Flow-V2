import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FadeIn from './FadeIn.jsx';
import { downloadChecklistDocx } from '../lib/docxBuilder.js';

// Renders the requirements checklist on a tender detail page.
//
// Visual layout: hero block with a gold left accent, clipboard icon,
// eyebrow + serif title. Below that, a teaser of the first 3 items is
// always visible so anonymous users see what they're signing up for.
//
// Behaviour:
//   - Anonymous user: teaser visible; "Sign up to view full checklist"
//     button routes to /sign-up with the current tender as the return.
//   - Signed-in collapsed: same teaser; "Show all N requirements" expands.
//   - Signed-in expanded: progress ring + filter chips
//     (All / Outstanding / Done) + interactive checklist + actions
//     (Download as Word, Reset).
export default function TenderChecklist({ tender, user }) {
  const navigate = useNavigate();
  const items = Array.isArray(tender.checklist) ? tender.checklist : [];
  const storageKey = `tf-checklist-${tender.id}`;
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState({});
  const [filter, setFilter] = useState('all'); // 'all' | 'outstanding' | 'done'

  useEffect(() => {
    if (!user) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setChecked(saved);
    } catch {}
  }, [user, storageKey]);

  function toggle(i) {
    setChecked(prev => {
      const next = { ...prev, [i]: !prev[i] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // No checklist on this tender (admin hasn't attached one). Render
  // nothing rather than an empty hero block.
  if (!items.length) return null;

  const totalDone = items.reduce((n, _, i) => n + (checked[i] ? 1 : 0), 0);
  const totalOutstanding = items.length - totalDone;
  const pct = items.length ? Math.round((totalDone / items.length) * 100) : 0;

  // Items the open list actually renders. Original indices are preserved
  // so toggle() still mutates the right key when the user is filtering.
  const visibleItems = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ originalIndex }) => {
      if (filter === 'outstanding') return !checked[originalIndex];
      if (filter === 'done') return Boolean(checked[originalIndex]);
      return true;
    });

  const teaserItems = items.slice(0, 3);
  const remainingCount = Math.max(0, items.length - 3);

  return (
    <FadeIn className="tf-checklist tf-checklist-hero">
      {/* ── Header: icon + eyebrow + serif title + headline action ─── */}
      <div className="tf-checklist-head">
        <div className="tf-checklist-head-text">
          <div className="tf-checklist-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                d="M9 2a1 1 0 0 0-1 1v1H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V3a1 1 0 0 0-1-1H9Zm1 2h4v2h-4V4Zm-1 7 1.4-1.4 1.6 1.6 3.6-3.6L17 9l-5 5-3-3Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <div className="tf-eyebrow tf-eyebrow-rule" style={{ color: 'var(--gold)' }}>
              Bid requirements
            </div>
            <h3 className="tf-checklist-title">Requirements checklist</h3>
            <p className="tf-checklist-sub">
              {user
                ? `${items.length} mandatory requirements extracted from this tender${open ? `. ${totalDone} of ${items.length} done.` : '.'}`
                : `${items.length} mandatory requirements extracted from this tender. Sign up to tick off items and download as Word.`}
            </p>
          </div>
        </div>
        <button
          className="tf-cta"
          onClick={() => {
            if (!user) {
              navigate('/sign-up', { state: { from: `/tenders/${tender.id}` } });
            } else {
              setOpen(o => !o);
            }
          }}
        >
          {!user
            ? 'Sign up to view checklist'
            : open
              ? 'Hide checklist'
              : `Show all ${items.length} requirements`}
        </button>
      </div>

      {/* ── Teaser preview: first 3 items, always visible ─────────────
         Gives anonymous users a real preview of what they're about to
         sign up for, and gives signed-in users a glimpse before they
         expand. Faded for anonymous so the call-to-action wins. */}
      {!open && (
        <div className={'tf-checklist-teaser' + (!user ? ' is-locked' : '')}>
          <ul>
            {teaserItems.map((it, i) => (
              <li key={i}>
                <span className="tf-check-box" aria-hidden="true" />
                <span>{it.text}</span>
              </li>
            ))}
          </ul>
          {remainingCount > 0 && (
            <div className="tf-checklist-more">
              + {remainingCount} more requirement{remainingCount === 1 ? '' : 's'}
            </div>
          )}
        </div>
      )}

      {/* ── Expanded state (signed-in only) ───────────────────────────
         Progress ring + filter chips + interactive list + actions. */}
      {user && open && (
        <>
          <div className="tf-checklist-status">
            <ProgressRing pct={pct} done={totalDone} total={items.length} />
            <div className="tf-checklist-status-text">
              <div className="tf-checklist-status-line">
                <strong>{totalDone}</strong> of {items.length} done
              </div>
              <div className="tf-checklist-status-sub">
                {totalOutstanding === 0
                  ? 'Every requirement covered. Submit with confidence.'
                  : `${totalOutstanding} outstanding`}
              </div>
            </div>
          </div>

          <div className="tf-checklist-filters" role="tablist">
            {[
              { k: 'all', label: 'All', count: items.length },
              { k: 'outstanding', label: 'Outstanding', count: totalOutstanding },
              { k: 'done', label: 'Done', count: totalDone }
            ].map(f => (
              <button
                key={f.k}
                className={'tf-checklist-filter' + (filter === f.k ? ' is-active' : '')}
                onClick={() => setFilter(f.k)}
                role="tab"
                aria-selected={filter === f.k}
              >
                {f.label} <span className="tf-checklist-filter-count">{f.count}</span>
              </button>
            ))}
          </div>

          <ul style={{ marginTop: 8 }}>
            {visibleItems.length === 0 ? (
              <li style={{ color: 'var(--muted)', fontStyle: 'italic', borderBottom: 0, gridTemplateColumns: '1fr' }}>
                {filter === 'done'
                  ? 'Nothing ticked off yet. Get started on the requirements list.'
                  : 'No outstanding items. Every requirement is covered.'}
              </li>
            ) : (
              visibleItems.map(({ item, originalIndex }) => (
                <li key={originalIndex}>
                  <span
                    className={'tf-check-box' + (checked[originalIndex] ? ' is-on' : '')}
                    role="checkbox"
                    aria-checked={Boolean(checked[originalIndex])}
                    tabIndex={0}
                    onClick={() => toggle(originalIndex)}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(originalIndex); } }}
                  />
                  <span style={{
                    textDecoration: checked[originalIndex] ? 'line-through' : 'none',
                    color: checked[originalIndex] ? 'var(--muted)' : 'var(--ink)'
                  }}>
                    {item.text}
                  </span>
                </li>
              ))
            )}
          </ul>

          <div className="tf-checklist-actions">
            <button
              className="tf-cta-ghost"
              onClick={() => downloadChecklistDocx(tender, items)}
            >
              Download as Word document
            </button>
            <button
              className="tf-cta-ghost"
              onClick={() => {
                if (confirm('Reset all checks for this tender?')) {
                  setChecked({});
                  try { localStorage.removeItem(storageKey); } catch {}
                }
              }}
            >
              Reset checks
            </button>
          </div>
        </>
      )}
    </FadeIn>
  );
}

// Circular progress ring. SVG-based for crisp rendering at any size and
// CSS-animatable via stroke-dasharray. Pct is 0-100. Done/total render
// in the centre.
function ProgressRing({ pct, done, total }) {
  // r = 15.9 gives a circumference of ~100, so stroke-dasharray "pct 100"
  // maps directly to a percentage. transform: rotate(-90deg) so the ring
  // fills from 12 o'clock.
  return (
    <div className="tf-progress-ring" aria-label={`${done} of ${total} requirements complete`}>
      <svg viewBox="0 0 36 36" width="68" height="68">
        <circle
          cx="18" cy="18" r="15.9"
          fill="none"
          stroke="var(--rule)"
          strokeWidth="3"
        />
        <circle
          cx="18" cy="18" r="15.9"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="3"
          strokeDasharray={`${pct} 100`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
          style={{ transition: 'stroke-dasharray 320ms cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="tf-progress-ring-pct">{pct}%</div>
    </div>
  );
}
