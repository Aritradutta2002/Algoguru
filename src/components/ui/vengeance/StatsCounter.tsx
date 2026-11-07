import React, { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StatsCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  className?: string;
}

export function StatsCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1.6,
  delay = 0,
  className,
}: StatsCounterProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduceMotion || !isInView) {
      el.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
      return;
    }

    // Direct DOM text update avoids scheduling React state updates 60fps
    el.textContent = `${prefix}0${suffix}`;
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        if (el) {
          el.textContent = `${prefix}${Math.round(latest).toLocaleString()}${suffix}`;
        }
      },
      onComplete: () => {
        if (el) {
          el.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [value, duration, delay, isInView, reduceMotion, prefix, suffix]);

  return (
    <span
      ref={ref}
      className={cn("inline-flex items-baseline font-mono font-bold tracking-tight", className)}
    >
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}

export default StatsCounter;
