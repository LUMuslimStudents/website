import { useEffect, useRef, useState } from "react";

/**
 * Counts up to `value` once the element scrolls into view.
 * Falls back to the final value when the user prefers reduced motion.
 */
export const StatCounter = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);
  const shown = useRef(0);

  useEffect(() => {
    shown.current = display;
  }, [display]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    const animate = (from: number) => {
      const duration = 1400;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(from + (value - from) * eased));
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    };

    // Already counted once and the value changed since (e.g. live stats
    // arrived) — roll from the old number instead of restarting at zero.
    if (started.current) {
      animate(shown.current);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            observer.disconnect();
            animate(0);
            break;
          }
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
};
