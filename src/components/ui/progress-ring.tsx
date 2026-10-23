import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** 0 — 100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  children?: ReactNode;
  label?: string;
}

/**
 * Circular progress with an animated sweep. `children` render centred inside
 * the ring, which lets callers show a value, icon or label without another
 * absolute-positioning wrapper.
 */
export function ProgressRing({
  value,
  size = 88,
  strokeWidth = 7,
  className,
  trackClassName,
  indicatorClassName,
  children,
  label,
}: ProgressRingProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-muted", trackClassName)}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduceMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
          }
          className={cn("stroke-primary", indicatorClassName)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
