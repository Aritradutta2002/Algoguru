import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface PageTransitionProps {
  /** Remount (and replay the enter animation) whenever this changes. */
  routeKey: string;
  children: ReactNode;
}

/**
 * Route enter transition — a quick fade-and-rise. Enter-only by design:
 * no exit animation, so route changes never keep the old tree mounted.
 */
export function PageTransition({ routeKey, children }: PageTransitionProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
