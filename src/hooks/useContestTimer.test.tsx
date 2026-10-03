import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { useContestTimer } from "@/hooks/useContestTimer";
import { formatExamTime } from "@/lib/formatTime";

const START = new Date("2026-09-30T12:00:00Z");
const START_MS = START.getTime();

/** Renders the hook and exposes its latest value. */
function renderTimer(options: {
  expiresAt: number | null;
  startedAt?: number | null;
  onExpire: () => void;
}) {
  const seen: { remainingSeconds: number; elapsedSeconds: number; expired: boolean }[] = [];
  function Probe(props: typeof options) {
    const value = useContestTimer({
      expiresAt: props.expiresAt,
      startedAt: props.startedAt ?? null,
      onExpire: props.onExpire,
    });
    seen.push(value);
    return (
      <span role="timer" aria-label="Time remaining">
        {formatExamTime(value.remainingSeconds)}
      </span>
    );
  }
  render(<Probe {...options} />);
  return {
    seen,
    get current() {
      return seen[seen.length - 1];
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useContestTimer", () => {
  it("stays idle with zero remaining time until a deadline is set", () => {
    const onExpire = vi.fn();
    const timer = renderTimer({ expiresAt: null, onExpire });
    expect(timer.current.remainingSeconds).toBe(0);
    act(() => vi.advanceTimersByTime(60_000));
    expect(timer.current.remainingSeconds).toBe(0);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("derives remaining time from the absolute deadline, not a decrementing counter", () => {
    const onExpire = vi.fn();
    const timer = renderTimer({
      expiresAt: START_MS + 30 * 60_000,
      onExpire,
    });
    expect(timer.current.remainingSeconds).toBe(1800);
    act(() => vi.advanceTimersByTime(10 * 60_000));
    expect(timer.current.remainingSeconds).toBe(1200);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("reports elapsed time from the absolute start", () => {
    const timer = renderTimer({
      expiresAt: null,
      startedAt: START_MS,
      onExpire: vi.fn(),
    });
    expect(timer.current.elapsedSeconds).toBe(0);
    act(() => vi.advanceTimersByTime(125_000));
    expect(timer.current.elapsedSeconds).toBe(125);
  });

  it("fires onExpire exactly once when the deadline passes", () => {
    const onExpire = vi.fn();
    renderTimer({ expiresAt: START_MS + 60_000, onExpire });
    act(() => vi.advanceTimersByTime(59_000));
    expect(onExpire).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2_000));
    expect(onExpire).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(10_000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it.each(["visibilitychange", "focus"])(
    "expires a suspended tab on %s without waiting for a tick",
    (event) => {
      const onExpire = vi.fn();
      const timer = renderTimer({ expiresAt: START_MS + 60_000, onExpire });
      act(() => {
        // setSystemTime alone runs neither the interval nor the listeners.
        vi.setSystemTime(START_MS + 90_000);
        (event === "focus" ? window : document).dispatchEvent(new Event(event));
      });
      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(timer.current.remainingSeconds).toBe(0);
    },
  );

  it("never reports negative remaining time", () => {
    const timer = renderTimer({
      expiresAt: START_MS + 60_000,
      onExpire: vi.fn(),
    });
    act(() => vi.advanceTimersByTime(600_000));
    expect(timer.current.remainingSeconds).toBe(0);
  });
});
