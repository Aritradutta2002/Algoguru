import { useEffect, useRef, useState } from "react";

/**
 * Deadline-driven exam clock.
 *
 * Always derived from an ABSOLUTE timestamp — never a decrementing counter —
 * so a suspended tab, a throttled interval, or a stale render cannot hand a
 * learner extra time. On every tick (and on `visibilitychange` / `focus`, for
 * a tab that was suspended past the deadline) the remaining time is recomputed
 * from the wall clock, and `onExpire` fires exactly once.
 */

export interface ContestTimerOptions {
  /** Epoch ms. Null keeps the clock idle (e.g. before fullscreen is entered). */
  expiresAt: number | null;
  /** Epoch ms, used for the elapsed reading in practice-style sessions. */
  startedAt?: number | null;
  onExpire: () => void;
  tickMs?: number;
}

export interface ContestTimer {
  remainingSeconds: number;
  elapsedSeconds: number;
  /** True once the clock has fired `onExpire`; stays true afterwards. */
  expired: boolean;
}

export function useContestTimer({
  expiresAt,
  startedAt = null,
  onExpire,
  tickMs = 250,
}: ContestTimerOptions): ContestTimer {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const expiredRef = useRef(false);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    expiredRef.current = false;
  }, [expiresAt, startedAt]);

  useEffect(() => {
    // A session may legitimately have no deadline (practice-style) while still
    // needing an elapsed reading, so the clock runs when EITHER timestamp is
    // present rather than keying off the deadline alone.
    if (expiresAt === null && startedAt === null) {
      setRemainingSeconds(0);
      setElapsedSeconds(0);
      return;
    }

    const update = () => {
      const now = Date.now();
      if (startedAt !== null) {
        setElapsedSeconds(Math.max(0, Math.floor((now - startedAt) / 1000)));
      }
      if (expiresAt === null) return;
      const left = Math.max(0, Math.ceil((expiresAt - now) / 1000));
      setRemainingSeconds(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        expireRef.current();
      }
    };

    update();
    const interval = window.setInterval(update, tickMs);
    // A tab that was suspended past the deadline must expire on return rather
    // than waiting for the next interval tick.
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [expiresAt, startedAt, tickMs]);

  return { remainingSeconds, elapsedSeconds, expired: expiredRef.current };
}
