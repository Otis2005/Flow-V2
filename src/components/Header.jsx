import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../lib/AuthProvider.jsx';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/tenders', label: 'Browse Tenders' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/about', label: 'About' },
  { to: '/admin', label: 'Admin' }
];

export default function Header({ logoVariant = 'bars' }) {
  const [mobOpen, setMobOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => { setMobOpen(false); }, [location.pathname]);

  return (
    <>
      <div className="tf-topbar">
        <div className="tf-container tf-topbar-row">
          <span>Live tenders updated daily across Africa</span>
          <div className="tf-topbar-meta">
            <a onClick={() => {}}>EN</a>
            <a onClick={() => {}}>FR</a>
            <Link to="/digest" className="tf-hide-sm">Subscribe to digest</Link>
            {user ? (
              <a onClick={signOut} style={{ cursor: 'pointer' }}>Sign out</a>
            ) : (
              <Link to="/sign-in">Sign in</Link>
            )}
          </div>
        </div>
      </div>
      <header className="tf-header">
        <div className="tf-container tf-header-row">
          <Logo variant={logoVariant} onClick={() => navigate('/')} />
          <nav className="tf-nav">
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="tf-header-cta">
            <button className="tf-cta-ghost tf-hide-sm" onClick={() => navigate('/tenders')}>Browse</button>
            <button className="tf-cta" onClick={() => navigate('/digest')}>Get the digest</button>
          </div>
          <button
            className={'tf-burger' + (mobOpen ? ' is-open' : '')}
            aria-label="Menu"
            onClick={() => setMobOpen(o => !o)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
        {mobOpen && (
          <div className="tf-mobnav">
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="tf-mobnav-actions">
              <button className="tf-cta-ghost" onClick={() => navigate('/tenders')}>Browse tenders</button>
              <button className="tf-cta" onClick={() => navigate('/digest')}>Get the digest</button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
