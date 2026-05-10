import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FadeIn from './FadeIn.jsx';
import { downloadChecklistDocx } from '../lib/docxBuilder.js';

// Renders the requirements checklist on a tender detail page.
//
// Behaviour:
//   - Anonymous user: shows a "Show checklist" button. Clicking it routes
//     to /sign-up with the current tender as the post-signup return path.
//   - Signed-in user: shows a "Show checklist" button that expands the
//     full interactive checklist on click. Hidden by default to keep the
//     page tight; the user pulls it up when they need it.
export default function TenderChecklist({ tender, user }) {
  const navigate = useNavigate();
  const items = Array.isArray(tender.checklist) ? tender.checklist : [];
  const storageKey = `tf-checklist-${tender.id}`;
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState({});

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

  // No checklist available at all -> render nothing (admin hasn't
  // attached one yet for this tender).
  if (!items.length) return null;

  const totalDone = Object.values(checked).filter(Boolean).length;

  return (
    <FadeIn className="tf-checklist tf-checklist-collapsible">
      <div className="tf-checklist-head">
        <div>
          <h3 style={{ margin: 0 }}>Requirements checklist</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0' }}>
            {user
              ? `${items.length} mandatory requirements extracted from this tender${open ? `. ${totalDone} of ${items.length} done.` : '.'}`
              : `${items.length} mandatory requirements extracted from this tender. Sign up to view, tick off, and download as Word.`}
          </p>
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
              : 'Show checklist'}
        </button>
      </div>

      {user && open && (
        <>
          <ul style={{ marginTop: 18 }}>
            {items.map((it, i) => (
              <li key={i}>
                <span
                  className={'tf-check-box' + (checked[i] ? ' is-on' : '')}
                  role="checkbox"
                  aria-checked={Boolean(checked[i])}
                  tabIndex={0}
                  onClick={() => toggle(i)}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(i); } }}
                />
                <span style={{
                  textDecoration: checked[i] ? 'line-through' : 'none',
                  color: checked[i] ? 'var(--muted)' : 'var(--ink)'
                }}>
                  {it.text}
                </span>
              </li>
            ))}
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
