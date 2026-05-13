import { Link } from 'react-router-dom';

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
      </div>
      <div className="tf-container tf-footer-base">
        <span>© {new Date().getFullYear()} TenderFlow. East African tender intelligence.</span>
        <span style={{ color: 'var(--muted)' }}>Built in Nairobi.</span>
      </div>
    </footer>
  );
}
