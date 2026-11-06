import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MorphTextProps {
  words?: string[];
  defaultWord?: string;
  interval?: number;
  className?: string;
}

export function MorphText({
  words = ["Interview ready.", "DSA patterns.", "System design.", "Java internals."],
  defaultWord = "Interview ready.",
  interval = 4000,
  className,
}: MorphTextProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || words.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval, reduceMotion]);

  // If reduced motion is requested, render the default word statically
  if (reduceMotion) {
    return <span className={cn("inline-block", className)}>{defaultWord}</span>;
  }

  return (
    <span className="inline-block relative overflow-visible" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={cn("inline-block whitespace-nowrap", className)}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default MorphText;
