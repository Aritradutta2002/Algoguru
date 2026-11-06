import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Counts up to `value` the first time the element scrolls into view.
 * Reduced motion (and the no-IO fallback) render the final number immediately,
 * so the figure is never wrong for assistive tech or in tests.
 */
export function Counter({
  value,
  duration = 1100,
  className,
  suffix,
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setShown(value);
      return;
    }
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(value);
      return;
    }

    let frame = 0;
    let started = false;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        // easeOutExpo — fast early, settles gently
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setShown(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !started) {
          started = true;
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [duration, reduceMotion, value]);

  return (
    <span ref={ref} className={className} data-numeric>
      {shown}
      {suffix}
    </span>
  );
}
