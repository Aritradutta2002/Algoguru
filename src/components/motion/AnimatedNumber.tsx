import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface AnimatedNumberProps {
  /** Target value to count to. */
  to: number;
  /** Rendered after the number, e.g. "+". */
  suffix?: string;
  /** Animation length in ms. */
  duration?: number;
  className?: string;
}

/** Counts from 0 to `to` the first time it scrolls into view. */
export function AnimatedNumber({ to, suffix = "", duration = 1200, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className ?? "tabular-nums"}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
