import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FadeIn from './FadeIn.jsx';
import { useAuth } from '../lib/AuthProvider.jsx';

// Where the four hero images live. Same bucket as everywhere else,
// pre-compressed WebP, immutable cached.
const SUPABASE_PUBLIC =
  'https://rtessqlvvsjecogctwok.supabase.co/storage/v1/object/public/tender-pdfs/hero';

// Each slide rotates eyebrow, title, subtitle, CTA and image together.
// Order matters: index 0 is the first one users see, so it's the broad
// pitch. Subsequent slides hit different audience segments.
//
// To swap copy or images: edit this array. To add a slide: append an
// entry. To remove one: delete its entry. No other changes needed.
const SLIDES = [
  {
    key: 'main',
    eyebrow: 'Pan-African tender intelligence',
    title: <>Government, NGO and SME tenders, <em>all in one place.</em></>,
    subtitle:
      'Stop refreshing twenty portals. We consolidate live opportunities from ministries, parastatals, NGOs and SMEs across the continent.',
    ctaLabel: 'Browse all tenders',
    ctaPath: '/tenders',
    image: 'construction.webp'
  },
  {
    key: 'bidder',
    eyebrow: 'For active bidders',
    title: <>Win more tenders. <em>Spend less time hunting them down.</em></>,
    subtitle:
      'A free account saves tenders to your watchlist, generates a requirements checklist for each one, and never lets you miss a closing date.',
    ctaLabel: 'Sign up free',
    ctaPath: '/sign-up',
    image: 'meeting.webp'
  },
  {
    key: 'consultants',
    eyebrow: 'Tender consultants, listed',
    title: <>Hire vetted consultants. <em>Or get hired by serious bidders.</em></>,
    subtitle:
      'Tender writers, evaluators, and bid managers across Africa. Free to register, free to discover, free to enquire.',
    ctaLabel: 'Find a consultant',
    ctaPath: '/consultants',
    image: 'blueprints.webp'
  },
  {
    key: 'ai',
    eyebrow: 'AI-powered extraction',
    title: <>Title, deadlines, requirements. <em>Auto-extracted in seconds.</em></>,
    subtitle:
      'Upload any tender PDF. Claude reads it, surfaces the fields that matter, and generates a checklist of everything bidders need to submit.',
    ctaLabel: 'See how it works',
    ctaPath: '/how-it-works',
    image: 'city.webp'
  }
];

const ROTATION_MS = 6000;

export default function HeroCarousel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef(null);
  const timerRef = useRef(null);

  // Parallax scroll handler, rAF-throttled like everywhere else.
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

  // Auto-rotation. Pauses on hover. Respects prefers-reduced-motion (no
  // auto-rotate at all in that case; user can still click dots).
  useEffect(() => {
    if (paused) return;
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timerRef.current = setTimeout(() => {
      setIndex(i => (i + 1) % SLIDES.length);
    }, ROTATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, paused]);

  // Scroll fade on the whole backdrop container (no transition, tracks
  // scroll continuously). Image-to-image crossfade is a CSS transition
  // on each individual slide image's opacity.
  const parallaxY = Math.min(scrollY * 0.35, 320);
  const backdropOpacity = Math.max(0.18, 0.95 - scrollY / 600);

  const slide = SLIDES[index];

  // Override the first CTA for signed-in users so it doesn't say "Sign
  // up free" to someone who already has an account. The other slide CTAs
  // are universal.
  const ctaLabel =
    user && slide.key === 'bidder' ? 'Open dashboard' : slide.ctaLabel;
  const ctaPath =
    user && slide.key === 'bidder' ? '/dashboard' : slide.ctaPath;

  return (
    <section
      className="tf-hero tf-hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="tf-hero-backdrop" style={{ opacity: backdropOpacity }} aria-hidden="true">
        {SLIDES.map((s, i) => (
          <div
            key={s.image}
            className={'tf-hero-backdrop-img tf-hero-backdrop-slide' + (i === index ? ' is-active' : '')}
            style={{
              backgroundImage: `url(${SUPABASE_PUBLIC}/${s.image})`,
              transform: `translate3d(0, ${parallaxY}px, 0) scale(1.08)`
            }}
          />
        ))}
        <div className="tf-hero-backdrop-overlay" />
      </div>

      <div className="tf-container">
        <div className="tf-hero-text">
          <div>
            {/* The key={slide.key} on this div re-mounts the element on slide
                change, which retriggers the CSS slide-up animation. */}
            <div key={`eyebrow-${slide.key}`} className="tf-hero-eyebrow-slot tf-hero-slide-in">
              <div className="tf-eyebrow tf-eyebrow-rule">{slide.eyebrow}</div>
            </div>
            <h1 key={`title-${slide.key}`} className="tf-display tf-hero-slide-in tf-hero-slide-in-delay-1">
              {slide.title}
            </h1>
          </div>
          <div className="tf-hero-text-side">
            <p key={`sub-${slide.key}`} className="tf-hero-slide-in tf-hero-slide-in-delay-2">
              {slide.subtitle}
            </p>
            <div
              key={`cta-${slide.key}`}
              className="tf-hero-text-actions tf-hero-slide-in tf-hero-slide-in-delay-3"
            >
              <button className="tf-cta" onClick={() => navigate(ctaPath)}>
                {ctaLabel}
              </button>
              <button className="tf-cta-ghost" onClick={() => navigate('/tenders')}>
                Browse all tenders
              </button>
            </div>
          </div>
        </div>

        <div className="tf-hero-dots" role="tablist" aria-label="Hero slides">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
              className={'tf-hero-dot' + (i === index ? ' is-active' : '')}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
