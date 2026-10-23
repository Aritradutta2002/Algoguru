import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  /** Text rendered after the number, e.g. "+" or "%". */
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

const format = (value: number, decimals: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

/**
 * Counts up once when scrolled into view. Uses rAF rather than a spring so the
 * digits stay crisp, and skips straight to the final value for reduced motion.
 */
export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1400,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() => format(0, decimals));
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(format(value, decimals));
      return;
    }

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        // expo-out keeps the motion quick at the start and settled at the end
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setDisplay(format(value * eased, decimals));
        if (progress < 1) requestAnimationFrame(tick);
        else setDisplay(format(value, decimals));
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      run();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, decimals, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
