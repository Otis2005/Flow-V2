import FadeIn from './FadeIn.jsx';

// Navy hero band used at the top of secondary pages (Listings, How it
// works, About, info pages). Mirrors the consultant CTA band visually
// so the whole site reads as one design system instead of cream-only.
//
// Props:
//   eyebrow  short label above the title
//   title    large display heading (can be JSX with <em> highlights)
//   subtitle optional sub-paragraph
//   children optional right-side content (filter chip, stats, etc.)
export default function PageHero({ eyebrow, title, subtitle, children, compact = false }) {
  return (
    <section className={'tf-page-hero' + (compact ? ' tf-page-hero-compact' : '')}>
      <div className="tf-container">
        <div className="tf-page-hero-grid">
          <FadeIn>
            {eyebrow && (
              <div className="tf-eyebrow tf-eyebrow-rule" style={{ color: 'rgba(245,246,235,0.6)' }}>
                {eyebrow}
              </div>
            )}
            <h1 className="tf-page-hero-title">{title}</h1>
            {subtitle && <p className="tf-page-hero-sub">{subtitle}</p>}
          </FadeIn>
          {children && (
            <FadeIn delay={120} className="tf-page-hero-aside">
              {children}
            </FadeIn>
          )}
        </div>
      </div>
    </section>
  );
}
