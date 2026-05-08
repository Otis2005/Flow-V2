export default function Logo({ onClick, variant = 'bars' }) {
  return (
    <div className="tf-logo" data-variant={variant} onClick={onClick} style={{ cursor: 'pointer' }}>
      {variant === 'bars' && (
        <span className="tf-logo-mark" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
      )}
      {variant === 'monogram' && <span className="tf-logo-mono" aria-hidden="true">TF</span>}
      {variant === 'dot' && <span className="tf-logo-dot" aria-hidden="true"></span>}
      {variant === 'chevron' && (
        <svg className="tf-logo-chev" viewBox="0 0 28 24" aria-hidden="true">
          <path d="M2 4 L14 14 L26 4" stroke="var(--amber)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".75" />
          <path d="M2 12 L14 22 L26 12" stroke="var(--teal)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
        </svg>
      )}
      <span className="tf-logo-text">Tender<em>Flow</em></span>
    </div>
  );
}
