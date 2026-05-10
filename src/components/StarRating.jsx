// StarRating — display + interactive variants.
//
// <Stars value={4.5} /> shows a non-interactive 5-star row.
// <StarsInput value={3} onChange={n => …} /> is an interactive picker.

function StarSVG({ kind = 'empty' }) {
  if (kind === 'half') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <defs>
          <linearGradient id="star-half">
            <stop offset="50%" stopColor="#d8a73b" />
            <stop offset="50%" stopColor="rgba(20,30,40,0.18)" />
          </linearGradient>
        </defs>
        <path
          d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z"
          fill="url(#star-half)"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z"
        className={kind}
      />
    </svg>
  );
}

// Sizes:
//   sm  -> 14px stars  (tiny inline use)
//   md  -> 18px stars  (default on cards/list rows)
//   lg  -> 24px stars  (detail pages, headers)
const SIZE_PX = { sm: 14, md: 18, lg: 24 };

export function Stars({ value, size = 'md', showNumber = true, hideIfEmpty = false }) {
  const v = Number(value || 0);
  if (!v) {
    if (hideIfEmpty) return null;
    return (
      <span className={'tf-stars tf-stars-' + size}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Not rated</span>
      </span>
    );
  }
  const full = Math.floor(v);
  const half = v - full >= 0.25 && v - full < 0.75;
  const round = v - full >= 0.75 ? full + 1 : full;
  const renderFull = half ? full : round;
  const px = SIZE_PX[size] || SIZE_PX.md;
  // Single-style number — round to nearest int and show as "4", not "4/5"
  const display = Math.round(v);

  return (
    <span className={'tf-stars tf-stars-' + size} style={{ '--star-px': px + 'px' }}>
      <span className="tf-stars-icons" style={{ '--star-px': px + 'px' }}>
        {[0, 1, 2, 3, 4].map(i => {
          if (i < renderFull) return <StarSVG key={i} kind="filled" />;
          if (i === renderFull && half) return <StarSVG key={i} kind="half" />;
          return <StarSVG key={i} kind="empty" />;
        })}
      </span>
      {showNumber && <span className="tf-stars-num">{display}</span>}
    </span>
  );
}

export function StarsInput({ value = 0, onChange }) {
  return (
    <div className="tf-stars-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          type="button"
          key={n}
          aria-checked={value === n}
          role="radio"
          className={value >= n ? 'is-on' : ''}
          onClick={() => onChange(value === n ? 0 : n)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
          </svg>
        </button>
      ))}
      <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8, alignSelf: 'center' }}>
        {value ? `${value} of 5` : 'Click to rate'}
      </span>
    </div>
  );
}
