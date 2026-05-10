import { useEffect, useRef, useState } from 'react';

// IntersectionObserver-driven fade-up. Adds a class once the element enters
// the viewport so the animation only runs once. Cheap and respects users'
// reduced-motion preference (the CSS handles that).
export default function FadeIn({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`tf-fade-up${shown ? ' is-shown' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms`, ...(rest.style || {}) } : rest.style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
