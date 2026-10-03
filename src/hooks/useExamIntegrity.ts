import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Exam focus integrity — fullscreen exit, tab switch and window blur.
 *
 * Two invariants this hook exists to guarantee:
 *   1. Listeners are registered only while `active` and only once, so a
 *      re-render can never double-count an interruption.
 *   2. A single interruption counts once. Leaving fullscreen, going hidden and
 *      blurring in the same instant is one violation, not three. The latch
 *      clears only when the learner explicitly resumes.
 */

export const INTEGRITY_REASONS = {
  fullscreen: "You left fullscreen.",
  hidden: "You switched tabs or minimized the exam.",
  blur: "The exam window lost focus.",
} as const;

export type IntegrityReasonKey = keyof typeof INTEGRITY_REASONS;

export interface ExamIntegrity {
  /** Non-null while the exam is locked; holds the interruption reason. */
  warning: string | null;
  warningCount: number;
  warningsRemaining: number;
  /** True once the learner must be auto-submitted. */
  terminated: boolean;
  locked: boolean;
  /** Clears the latch and re-arms the checks. Call after a verified resume. */
  resume: () => void;
}

interface UseExamIntegrityOptions {
  /** Listeners run only while true. */
  active: boolean;
  maxWarnings: number;
  /** Called once when the warning limit is reached. */
  onAutoSubmit: () => void;
}

export function useExamIntegrity({
  active,
  maxWarnings,
  onAutoSubmit,
}: UseExamIntegrityOptions): ExamIntegrity {
  const [warning, setWarning] = useState<string | null>(null);
  const [warningCount, setWarningCount] = useState(0);
  const interruptionRef = useRef<string | null>(null);
  const autoSubmitRef = useRef(onAutoSubmit);
  autoSubmitRef.current = onAutoSubmit;

  useEffect(() => {
    if (!active) return;

    const interrupt = (reason: string) => {
      if (interruptionRef.current) return;
      interruptionRef.current = reason;
      setWarning(reason);
      setWarningCount((current) => {
        const next = current + 1;
        if (next >= maxWarnings) {
          setTimeout(() => autoSubmitRef.current(), 0);
        }
        return next;
      });
    };

    const checkFullscreen = () => {
      if (document.fullscreenElement !== document.documentElement) {
        interrupt(INTEGRITY_REASONS.fullscreen);
      }
    };
    const checkVisibility = () => {
      if (document.hidden) interrupt(INTEGRITY_REASONS.hidden);
    };
    const checkFocus = () => interrupt(INTEGRITY_REASONS.blur);

    // Audit the current state as well as future changes, so a lock that
    // happened between render and effect registration is still caught.
    checkFullscreen();
    checkVisibility();

    document.addEventListener("fullscreenchange", checkFullscreen);
    document.addEventListener("visibilitychange", checkVisibility);
    window.addEventListener("blur", checkFocus);
    return () => {
      document.removeEventListener("fullscreenchange", checkFullscreen);
      document.removeEventListener("visibilitychange", checkVisibility);
      window.removeEventListener("blur", checkFocus);
    };
  }, [active, maxWarnings]);

  const resume = useCallback(() => {
    interruptionRef.current = null;
    setWarning(null);
  }, []);

  return {
    warning,
    warningCount,
    warningsRemaining: Math.max(0, maxWarnings - warningCount),
    terminated: warningCount >= maxWarnings,
    locked: warning !== null,
    resume,
  };
}
