// Inline SVG country flags for East African coverage (Kenya, Uganda,
// Tanzania). Self-hosted and tiny so we don't depend on emoji rendering
// (Windows browsers show regional-indicator codes instead of flags) or
// remote flag CDNs. Each SVG is ~600 bytes.
//
// When we expand outside East Africa, add more entries below.

const FLAGS = {
  Kenya: (
    <svg viewBox="0 0 60 36" aria-hidden="true">
      <rect width="60" height="36" fill="#000" />
      <rect y="9" width="60" height="18" fill="#fff" />
      <rect y="11.5" width="60" height="13" fill="#bb0000" />
      <rect y="22" width="60" height="6" fill="#fff" />
      <rect y="23" width="60" height="4" fill="#006600" />
      <ellipse cx="30" cy="18" rx="3.4" ry="6.5" fill="#bb0000" stroke="#fff" strokeWidth="0.8" />
      <ellipse cx="30" cy="18" rx="1.4" ry="3.8" fill="#000" />
    </svg>
  ),
  Uganda: (
    <svg viewBox="0 0 60 36" aria-hidden="true">
      <rect y="0"  width="60" height="6" fill="#000" />
      <rect y="6"  width="60" height="6" fill="#fcdc04" />
      <rect y="12" width="60" height="6" fill="#d90000" />
      <rect y="18" width="60" height="6" fill="#000" />
      <rect y="24" width="60" height="6" fill="#fcdc04" />
      <rect y="30" width="60" height="6" fill="#d90000" />
      <circle cx="30" cy="18" r="6" fill="#fff" />
      <circle cx="30" cy="18" r="3.4" fill="none" stroke="#000" strokeWidth="0.6" />
    </svg>
  ),
  Tanzania: (
    /* Tanzania: green triangle (upper-left) + blue triangle
       (lower-right), separated by a black diagonal band with yellow
       edging running from bottom-left to top-right. */
    <svg viewBox="0 0 60 36" aria-hidden="true">
      <rect width="60" height="36" fill="#1eb53a" />
      <polygon points="60,0 60,36 0,36" fill="#00a3dd" />
      <polygon points="-2,33 58,-3 62,3 2,39" fill="#fcd116" />
      <polygon points="0,34 58,-2 60,1 2,37" fill="#000" />
    </svg>
  )
};

export default function CountryFlag({ country, size = 'sm' }) {
  const flag = FLAGS[country];
  if (!flag) return null;
  return (
    <span className={'tf-flag tf-flag-' + size} title={country} aria-label={country}>
      {flag}
    </span>
  );
}
