import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fullscreen entry/exit shared by every exam mode.
 *
 * Semantics intentionally match the proven MCQ implementation: a denied,
 * unsupported, or "resolved but did not actually enter" request must all
 * return `false` so the caller never starts a timer or unlocks an exam.
 */
export interface FullscreenExam {
  isFullscreen: boolean;
  /** Non-null explains a failed attempt, for a live region. */
  message: string;
  enter: () => Promise<boolean>;
  exit: () => Promise<void>;
  clearMessage: () => void;
}

const UNSUPPORTED_MESSAGE =
  "Fullscreen is mandatory for this exam. Use a browser that supports fullscreen to start.";
const PERMISSION_MESSAGE =
  "Fullscreen permission is required. Allow fullscreen and try again to continue the exam.";

function isFull(): boolean {
  return (
    typeof document !== "undefined" &&
    document.fullscreenElement === document.documentElement
  );
}

export function useFullscreenExam(): FullscreenExam {
  const [isFullscreen, setIsFullscreen] = useState(isFull);
  const [message, setMessage] = useState("");

  // A single `fullscreenchange` listener for the whole hook, registered once.
  useEffect(() => {
    const sync = () => setIsFullscreen(isFull());
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const clearMessage = useCallback(() => setMessage(""), []);

  const enter = useCallback(async (): Promise<boolean> => {
    setMessage("");
    if (isFull()) return true;
    if (!document.documentElement.requestFullscreen) {
      setMessage(UNSUPPORTED_MESSAGE);
      return false;
    }
    try {
      await document.documentElement.requestFullscreen();
      if (isFull()) return true;
    } catch {
      // A denied fullscreen request must never start or unlock the exam.
    }
    setMessage(PERMISSION_MESSAGE);
    return false;
  }, []);

  const exit = useCallback(async (): Promise<void> => {
    if (isFull() && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch {
        setMessage("Use Escape to exit fullscreen.");
      }
    }
  }, []);

  return { isFullscreen, message, enter, exit, clearMessage };
}
