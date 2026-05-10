import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FadeIn from './FadeIn.jsx';
import { downloadChecklistDocx } from '../lib/docxBuilder.js';

// Renders the requirements checklist on a tender detail page. Logged-in users
// only — anonymous viewers see a soft sign-up prompt instead.
export default function TenderChecklist({ tender, user }) {
  const navigate = useNavigate();
  const items = Array.isArray(tender.checklist) ? tender.checklist : [];
  const storageKey = `tf-checklist-${tender.id}`;
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

  if (!items.length && !user) {
    // No checklist available, but we still encourage signup
    return null;
  }

  if (!items.length && user) {
    return (
      <FadeIn className="tf-checklist">
        <h3>Requirements checklist</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          No checklist generated for this tender yet. The admin can add one
          during upload.
        </p>
      </FadeIn>
    );
  }

  if (!user) {
    return (
      <FadeIn className="tf-checklist">
        <h3>Requirements checklist</h3>
        <div className="tf-checklist-locked">
          <p>
            We've extracted <strong>{items.length} mandatory requirements</strong> from this tender.
            Sign in to view, tick off, and download the full checklist as a Word document.
          </p>
          <button className="tf-cta" onClick={() => navigate('/sign-up')}>
            Sign up to unlock
          </button>
          <div style={{ marginTop: 10, fontSize: 12 }}>
            Already have an account? <Link to="/sign-in" style={{ color: 'var(--navy)', borderBottom: '1px solid var(--gold)' }}>Sign in</Link>.
          </div>
        </div>
      </FadeIn>
    );
  }

  const totalDone = Object.values(checked).filter(Boolean).length;

  return (
    <FadeIn className="tf-checklist">
      <h3>
        Requirements checklist
        <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)', fontWeight: 400 }}>
          {totalDone} / {items.length} done
        </span>
      </h3>
      <ul>
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
    </FadeIn>
  );
}
