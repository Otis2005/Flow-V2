import { useEffect, useRef, useState } from 'react';

// Hero image options. All self-hosted on Supabase Storage as compressed
// WebP files so they load from the same CDN as the rest of the site.
// No more Unsplash dependency or cross-origin latency.
//
// Sizes (after WebP compression at q=60, w=1200):
//   construction  279 KB  (default. Direct tie to procurement work.)
//   city          203 KB  (fastest cold-cache. African cityscape.)
//   blueprints     60 KB  (tiniest. Architectural plans close-up.)
//   meeting       331 KB  (Business meeting, original choice.)
//
// To swap:
//   1. Change HERO_VARIANT below to one of the keys.
//   2. Update the matching <link rel="preload"> URL in index.html.
//
// To add a new image:
//   1. Upload a WebP to tender-pdfs/hero/<name>.webp in Supabase Storage
//      (bucket is public, single round-trip from any browser).
//   2. Add an entry to HERO_IMAGES below.
//   3. Set HERO_VARIANT to its key, update index.html preload.

const SUPABASE_PUBLIC =
  'https://rtessqlvvsjecogctwok.supabase.co/storage/v1/object/public/tender-pdfs/hero';

const HERO_IMAGES = {
  construction: `${SUPABASE_PUBLIC}/construction.webp`,
  city:         `${SUPABASE_PUBLIC}/city.webp`,
  blueprints:   `${SUPABASE_PUBLIC}/blueprints.webp`,
  meeting:      `${SUPABASE_PUBLIC}/meeting.webp`
};

// Static hero: Kennedy picked the meeting photo (woman + man at a desk,
// faces toward the camera) over the construction/blueprint/city options.
// To swap: change the variant key and update the matching preload <link>
// in index.html.
const HERO_VARIANT = 'meeting';
const HERO_IMAGE = HERO_IMAGES[HERO_VARIANT];

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

  // Parallax + fade. Translate downward at 0.35x scroll (capped at 320px
  // so we stop wasting GPU below the fold). Opacity goes from 1.0 to
  // 0.25 across the first 600px of scroll. Image starts fully visible
  // because the new horizontal overlay gradient does the masking on
  // the left side rather than fading the whole image.
  const parallaxY = Math.min(scrollY * 0.35, 320);
  const opacity = Math.max(0.25, 1.0 - scrollY / 600);

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
