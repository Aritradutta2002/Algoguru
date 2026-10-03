import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { useExamIntegrity, INTEGRITY_REASONS } from "@/hooks/useExamIntegrity";
import {
  changeFullscreen,
  installExamBrowserEnv,
  loseFocus,
  restoreExamBrowserEnv,
  setFullscreenSilently,
  setHidden,
} from "@/test/examEnv";

const MAX = 4;

function renderIntegrity(options: { active?: boolean; maxWarnings?: number } = {}) {
  const onAutoSubmit = vi.fn();
  const seen: ReturnType<typeof useExamIntegrity>[] = [];
  function Probe() {
    const value = useExamIntegrity({
      active: options.active ?? true,
      maxWarnings: options.maxWarnings ?? MAX,
      onAutoSubmit,
    });
    seen.push(value);
    return (
      <div>
        <span data-testid="warning">{value.warning ?? "none"}</span>
        <span data-testid="count">{value.warningCount}</span>
        <span data-testid="remaining">{value.warningsRemaining}</span>
        <span data-testid="locked">{String(value.locked)}</span>
        <span data-testid="terminated">{String(value.terminated)}</span>
      </div>
    );
  }
  const utils = render(<Probe />);
  return { onAutoSubmit, utils, get current() { return seen[seen.length - 1]; } };
}

beforeEach(() => {
  installExamBrowserEnv();
});

afterEach(() => {
  cleanup();
  restoreExamBrowserEnv();
  vi.restoreAllMocks();
});

describe("useExamIntegrity", () => {
  it("stays quiet while inactive and never registers listeners", () => {
    const integrity = renderIntegrity({ active: false });
    act(() => {
      changeFullscreen(null);
      setHidden(true);
      loseFocus();
    });
    expect(integrity.current.locked).toBe(false);
    expect(integrity.current.warningCount).toBe(0);
  });

  it("locks with a reason when fullscreen is lost", () => {
    const integrity = renderIntegrity();
    act(() => changeFullscreen(null));
    expect(integrity.current.warning).toBe(INTEGRITY_REASONS.fullscreen);
    expect(integrity.current.locked).toBe(true);
    expect(integrity.current.warningCount).toBe(1);
    expect(integrity.current.warningsRemaining).toBe(MAX - 1);
  });

  it("distinguishes a tab switch from a focus loss", () => {
    // Start already in fullscreen so the mount-time audit is clean and the
    // reason under test is the only violation recorded.
    setFullscreenSilently(document.documentElement);

    const hidden = renderIntegrity();
    act(() => setHidden(true));
    expect(hidden.current.warning).toBe(INTEGRITY_REASONS.hidden);
    cleanup();

    // Return to fullscreen and focus so the second mount audits clean again.
    act(() => {
      setHidden(false);
      setFullscreenSilently(document.documentElement);
    });
    const blurred = renderIntegrity();
    act(() => loseFocus());
    expect(blurred.current.warning).toBe(INTEGRITY_REASONS.blur);
  });

  it("counts a single interruption once even when several fire together", () => {
    const integrity = renderIntegrity();
    act(() => {
      changeFullscreen(null);
      loseFocus();
      setHidden(true);
    });
    expect(integrity.current.warningCount).toBe(1);
    expect(integrity.current.warning).toBe(INTEGRITY_REASONS.fullscreen);
  });

  it("stays locked until an explicit resume, then re-arms", () => {
    const integrity = renderIntegrity();
    act(() => changeFullscreen(null));
    act(() => integrity.current.resume());
    expect(integrity.current.locked).toBe(false);
    expect(integrity.current.warningCount).toBe(1);
    // A second, genuinely new interruption still counts.
    act(() => loseFocus());
    expect(integrity.current.warningCount).toBe(2);
  });

  it("re-audits the current state when it becomes active", () => {
    const integrity = renderIntegrity();
    act(() => changeFullscreen(null));
    expect(integrity.current.warningCount).toBe(1);
    act(() => integrity.current.resume());
    // Still out of fullscreen, so re-activating must notice immediately.
    cleanup();
    const reactivated = renderIntegrity();
    expect(reactivated.current.warningCount).toBe(1);
  });

  it("auto-submits once the warning limit is reached", async () => {
    const integrity = renderIntegrity();
    for (let index = 0; index < MAX - 1; index += 1) {
      act(() => loseFocus());
      act(() => integrity.current.resume());
    }
    expect(integrity.current.warningCount).toBe(MAX - 1);
    expect(integrity.onAutoSubmit).not.toHaveBeenCalled();

    act(() => loseFocus());
    expect(integrity.current.warningCount).toBe(MAX);
    expect(integrity.current.terminated).toBe(true);
    // The hook defers the auto-submit by a task so the state update commits
    // first; let that task run.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(integrity.onAutoSubmit).toHaveBeenCalledTimes(1);
  });
});
