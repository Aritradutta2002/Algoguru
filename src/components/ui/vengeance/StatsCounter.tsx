import React, { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StatsCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function StatsCounter({
  value,
  duration = 1.4,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: StatsCounterProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;

    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [springValue, reduceMotion]);

  return (
    <span ref={ref} className={cn("tabular-nums font-bold", className)}>
      {prefix}
      {reduceMotion ? value : displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default StatsCounter;
