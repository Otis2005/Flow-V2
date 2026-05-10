import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls to top on every route change. Without this, react-router preserves
// the previous page's scroll position, which lands users mid-page.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Use 'instant' so it doesn't compete with the in-page entrance animations.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}
