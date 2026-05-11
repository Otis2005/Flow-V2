import { useEffect, useRef, useState } from 'react';

// Hero image options. The active value is the one used; the others sit as
// commented constants in case Kennedy wants to swap.
//
// All four are free-to-use Unsplash photos. Picked to (a) feel related to
// procurement / tender work and (b) blend with the navy + cream + gold
// palette after the theme overlay is applied.
//
//   1. African business meeting at a modern table (default)
//      photo-1573497019940-1c28c88b4f3e
//   2. Construction / infrastructure site
//      photo-1541888946425-d81bb19240f5
//   3. Architectural blueprints close-up
//      photo-1503387762-592deb58ef4e
//   4. Nairobi / Lagos cityscape feel
//      photo-1582719471384-894fbb16e074
//
// To swap, change HERO_IMAGE below AND the preload <link> in index.html
// so the new image is fetched as early as possible.
//
// URL params: w=1600 q=80 keeps it sharp at typical viewport widths while
// cutting the file from ~1MB to ~600KB.

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600&q=80&auto=format&fit=crop';

export default function HeroBackdrop({ src = HERO_IMAGE }) {
  const ref = useRef(null);
  const rafRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    function tick() {
      rafRef.current = null;
      setScrollY(window.scrollY);
    }
    function onScroll() {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(tick);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Parallax: the backdrop translates downward at 0.35x of scroll, so it
  // appears to scroll slower than the content above it. Capped so it does
  // not drift forever and waste GPU work below the fold.
  const parallaxY = Math.min(scrollY * 0.35, 320);

  // Cross-fade: hero image fades from 0.95 to 0.15 as you scroll the first
  // 500px. We never hit zero so the colour stays warm under the fold.
  const opacity = Math.max(0.15, 0.95 - scrollY / 600);

  return (
    <div className="tf-hero-backdrop" aria-hidden="true">
      <div
        ref={ref}
        className="tf-hero-backdrop-img"
        style={{
          backgroundImage: `url(${src})`,
          transform: `translate3d(0, ${parallaxY}px, 0) scale(1.08)`,
          opacity
        }}
      />
      <div className="tf-hero-backdrop-overlay" />
    </div>
  );
}
