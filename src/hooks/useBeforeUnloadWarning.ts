import { useEffect } from "react";

/**
 * Warn before the browser unloads with unsaved exam work.
 *
 * Browsers only honour a `returnValue` assignment in a `beforeunload` handler,
 * which is why both lines are present. Registered only while `enabled`, so a
 * finished exam does not keep nagging.
 */
export function useBeforeUnloadWarning(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [enabled]);
}
