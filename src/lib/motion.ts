import type { Transition, Variants } from "framer-motion";

/**
 * One motion language for the whole product.
 *
 * Entrances are deliberately slower than feedback, and springs are reserved
 * for direct manipulation (tabs, nav pills, reorder). Everything animates
 * transform/opacity only.
 */

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];
export const EASE_SPRING: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

export const DURATION = {
  fast: 0.12,
  base: 0.22,
  slow: 0.42,
} as const;

/** Per-item delays for sequenced groups (seconds). */
export const STAGGER = {
  line: 0.045,
  card: 0.055,
  row: 0.06,
} as const;

/**
 * The hero "session" runs once per mount. Values are milliseconds from mount:
 * code writes in, the suite runs, then results and progress settle.
 */
export const HERO_TIMELINE = {
  code: 450,
  running: 1150,
  pass: 1600,
  done: 2600,
} as const;

export const TILT_SPRING: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 26,
  mass: 0.6,
};

export const PARALLAX_SPRING: Transition = {
  type: "spring",
  stiffness: 90,
  damping: 22,
  mass: 0.4,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.7,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE_OUT },
  },
};

export const fadeUpSmall: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.slow, ease: EASE_OUT },
  },
};

export const staggerContainer = (stagger = 0.07, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});
