import { Link } from 'react-router-dom';

// Site-wide footer. Three columns: brand summary, link nav, contact +
// social. Social icons match the contact page treatment for visual
// consistency across the site.
export default function Footer() {
  return (
    <footer className="tf-footer tf-footer-compact">
      <div className="tf-container tf-footer-row">
        <div className="tf-footer-brand">
          <span className="tf-logo-text">Tender<em>Flow</em></span>
          <p className="tf-footer-tagline">
            Government, NGO, and SME tenders across East Africa, in one feed.
          </p>
        </div>
        <nav className="tf-footer-links" aria-label="Footer">
          <Link to="/tenders">Tenders</Link>
          <Link to="/consultants">Consultants</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
        <div className="tf-footer-contact" aria-label="Contact TenderFlow">
          <a href="mailto:info@tenderflow.co.ke" className="tf-footer-icon-link" aria-label="Email TenderFlow">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M3 7l9 7 9-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a href="tel:+254724131492" className="tf-footer-icon-link" aria-label="Call TenderFlow">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2 16 16 0 0 1-16-16 2 2 0 0 1 2-2z"
                fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </a>
          <span className="tf-footer-icon-spacer" aria-hidden="true" />
          <a
            href="https://www.linkedin.com/company/tenderflow-east-africa"
            target="_blank"
            rel="noopener"
            className="tf-footer-icon-link"
            aria-label="TenderFlow on LinkedIn"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                fill="currentColor"
              />
            </svg>
          </a>
          <a
            href="https://x.com/tenderflow_ea"
            target="_blank"
            rel="noopener"
            className="tf-footer-icon-link"
            aria-label="TenderFlow on X"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"
                fill="currentColor"
              />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/TenderFlowEastAfrica"
            target="_blank"
            rel="noopener"
            className="tf-footer-icon-link"
            aria-label="TenderFlow on Facebook"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103.43.071.812.156 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12S0 5.417 0 12.044c0 5.628 3.874 10.35 9.101 11.647Z"
                fill="currentColor"
              />
            </svg>
          </a>
        </div>
      </div>
      <div className="tf-container tf-footer-base">
        <span>© {new Date().getFullYear()} TenderFlow. East African tender intelligence.</span>
        <span style={{ color: 'var(--muted)' }}>Built in Nairobi.</span>
      </div>
    </footer>
  );
}
