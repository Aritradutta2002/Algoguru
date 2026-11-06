import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * FlipTerm — a single rotating word, adapted from Vengeance UI's Flip Text
 * (https://www.vengenceui.com/components/flip-text).
 *
 * The published component flips every character on a 2.2s loop; that is far too
 * much motion for a product surface that people read. This version:
 *   • rotates whole words on a 3.4s cadence, one flip per change;
 *   • reserves a fixed box so nothing around it reflows (no CLS);
 *   • renders only the first term when the user prefers reduced motion;
 *   • is decorative for assistive tech — the static term is exposed once.
 */

interface FlipTermProps {
  terms: readonly string[];
  className?: string;
  interval?: number;
}

export function FlipTerm({ terms, className, interval = 3400 }: FlipTermProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || terms.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % terms.length),
      interval,
    );
    return () => window.clearInterval(timer);
  }, [interval, reduceMotion, terms.length]);

  const label = terms[index] ?? terms[0];

  return (
    <span className={cn("relative inline-flex h-[1.35em] min-w-0 items-center overflow-hidden", className)}>
      <span className="sr-only">{terms[0]}</span>
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={label}
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0, rotateX: -55, y: "0.35em" }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, rotateX: 55, y: "-0.35em" }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="block truncate will-change-transform"
          style={{ transformOrigin: "50% 50%", backfaceVisibility: "hidden" }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
