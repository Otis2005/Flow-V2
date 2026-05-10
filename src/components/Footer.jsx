import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="tf-footer">
      <div className="tf-container tf-footer-grid">
        <div>
          <span className="tf-logo-text">Tender<em>Flow</em></span>
          <p className="tf-footer-blurb">
            We consolidate scattered opportunities into one place. Government, NGO,
            and SME tenders, side by side.
          </p>
        </div>
        <div>
          <h5>Browse</h5>
          <ul>
            <li><Link to="/tenders">All tenders</Link></li>
            <li><Link to="/tenders?source=Government">Government</Link></li>
            <li><Link to="/tenders?source=NGO">NGO</Link></li>
            <li><Link to="/tenders?source=SME">SME-friendly</Link></li>
            <li><Link to="/tenders">By sector</Link></li>
            <li><Link to="/tenders">By country</Link></li>
          </ul>
        </div>
        <div>
          <h5>Resources</h5>
          <ul>
            <li><Link to="/how-it-works">How it works</Link></li>
            <li><Link to="/consultants">Find a consultant</Link></li>
            <li><Link to="/guide">Bid-writing guide</Link></li>
            <li><Link to="/glossary">Glossary</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/submit-tender">Submit a tender</Link></li>
            <li><Link to="/consultant-signup">Become a consultant</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/press">Press</Link></li>
          </ul>
        </div>
      </div>
      <div className="tf-container tf-footer-bottom">
        <span>© {new Date().getFullYear()} TenderFlow. Pan-African opportunity intelligence.</span>
        <span>
          <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> · <Link to="/cookies">Cookies</Link>
        </span>
      </div>
    </footer>
  );
}
