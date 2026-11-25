import { afterEach, describe, expect, it, vi } from "vitest";
import { registerEscapeKeyHandler } from "./escapeKeyStack";

type EscapeHandler = (event: KeyboardEvent) => boolean;

const cleanups: Array<() => void> = [];

function register(handler: EscapeHandler, priority = 0) {
  const cleanup = registerEscapeKeyHandler(handler, priority);
  cleanups.push(cleanup);
  return cleanup;
}

function dispatchKey(key: string) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event;
}

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.restoreAllMocks();
});

describe("escapeKeyStack", () => {
  it("runs only the newest handling layer and consumes Escape", () => {
    const lower = vi.fn(() => true);
    const upper = vi.fn(() => true);
    const siblingListener = vi.fn();
    register(lower);
    register(upper);
    window.addEventListener("keydown", siblingListener);
    cleanups.push(() => window.removeEventListener("keydown", siblingListener));

    const event = dispatchKey("Escape");

    expect(upper).toHaveBeenCalledTimes(1);
    expect(lower).not.toHaveBeenCalled();
    expect(siblingListener).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it("falls through declining layers and stops at the first handling layer", () => {
    const bottom = vi.fn(() => true);
    const middle = vi.fn(() => false);
    const top = vi.fn(() => false);
    const siblingListener = vi.fn();
    register(bottom);
    register(middle);
    register(top);
    window.addEventListener("keydown", siblingListener);
    cleanups.push(() => window.removeEventListener("keydown", siblingListener));

    const event = dispatchKey("Escape");

    expect(top).toHaveBeenCalledTimes(1);
    expect(middle).toHaveBeenCalledTimes(1);
    expect(bottom).toHaveBeenCalledTimes(1);
    expect(siblingListener).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it("removes cleaned-up layers and leaves Escape untouched when none remain", () => {
    const lower = vi.fn(() => true);
    const upper = vi.fn(() => true);
    const removeLower = register(lower);
    const removeUpper = register(upper);

    removeUpper();
    const firstEvent = dispatchKey("Escape");

    expect(upper).not.toHaveBeenCalled();
    expect(lower).toHaveBeenCalledTimes(1);
    expect(firstEvent.defaultPrevented).toBe(true);

    removeLower();
    const siblingListener = vi.fn();
    window.addEventListener("keydown", siblingListener);
    cleanups.push(() => window.removeEventListener("keydown", siblingListener));
    const secondEvent = dispatchKey("Escape");

    expect(lower).toHaveBeenCalledTimes(1);
    expect(siblingListener).toHaveBeenCalledTimes(1);
    expect(secondEvent.defaultPrevented).toBe(false);
  });

  it("keeps higher roadmap layers above newer lower-priority registrations", () => {
    const overlay = vi.fn(() => true);
    const engine = vi.fn(() => true);
    register(overlay, 0);
    register(engine, 1);

    const event = dispatchKey("Escape");

    expect(engine).toHaveBeenCalledTimes(1);
    expect(overlay).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });
});
