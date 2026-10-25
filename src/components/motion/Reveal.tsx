import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Direction the content arrives from. */
  from?: "bottom" | "left" | "right" | "none";
  /** Delay in seconds. */
  delay?: number;
  /** Duration in seconds. */
  duration?: number;
  /** How much of the element must be visible before it animates. */
  amount?: number;
  once?: boolean;
  style?: CSSProperties;
  id?: string;
}

const OFFSETS = {
  bottom: { y: 18, x: 0 },
  left: { y: 0, x: -18 },
  right: { y: 0, x: 18 },
  none: { y: 0, x: 0 },
} as const;

/**
 * Scroll-triggered entrance used by marketing and index surfaces.
 * Honours reduced-motion by rendering the final state immediately.
 */
export function Reveal({
  children,
  className,
  from = "bottom",
  delay = 0,
  duration = 0.5,
  amount = 0.2,
  once = true,
  style,
  id,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const offset = OFFSETS[from];

  if (reduceMotion) {
    return (
      <div id={id} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount, margin: "0px 0px -40px 0px" }}
      transition={{ duration, delay, ease: EASE_OUT }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export const revealList: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};
