// AGPO badge. Renders only when a tender has an agpo_category set.
//
// AGPO = Access to Government Procurement Opportunities. Kenya reserves
// 30% of government procurement for businesses owned by youth, women,
// or persons with disabilities. Similar programmes exist elsewhere.
//
// Visual: small gold pill with a star glyph and uppercase "AGPO". The
// gradient + inset highlight + subtle shadow give it a "certified
// reservation" feel without being loud.

const CATEGORY_LABEL = {
  youth: 'Youth',
  women: 'Women',
  pwd: 'PWD',
  general: 'Open AGPO'
};

export default function AgpoBadge({ category, size = 'sm' }) {
  if (!category) return null;
  const label = CATEGORY_LABEL[category?.toLowerCase()] || 'AGPO';
  return (
    <span
      className={'tf-agpo-badge tf-agpo-' + size}
      title={`Reserved tender · AGPO${label !== 'AGPO' ? ' (' + label + ')' : ''}`}
      aria-label={`AGPO reserved tender, ${label}`}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.4l1.9 3.9 4.3.6-3.1 3 .73 4.3L8 11.1l-3.83 2.1.73-4.3-3.1-3 4.3-.6L8 1.4z" />
      </svg>
      <span className="tf-agpo-badge-label">AGPO</span>
      {label !== 'AGPO' && <span className="tf-agpo-badge-cat">· {label}</span>}
    </span>
  );
}
