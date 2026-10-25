import { useEffect, useState } from "react";
import { HERO_TIMELINE } from "@/lib/motion";

export type HeroPhase = "idle" | "code" | "running" | "pass" | "done";

/**
 * One-shot "session" state machine for the hero preview.
 *
 * Only the phase is React state — per-line and per-bar timing is CSS driven by
 * the `data-phase` attribute, so the whole sequence costs five renders.
 */
export function useHeroChoreography(reduceMotion: boolean | null): HeroPhase {
  const [phase, setPhase] = useState<HeroPhase>(reduceMotion ? "done" : "idle");

  useEffect(() => {
    if (reduceMotion) {
      setPhase("done");
      return;
    }

    const timers: number[] = [];
    const schedule = (value: HeroPhase, at: number) => {
      timers.push(window.setTimeout(() => setPhase(value), at));
    };

    schedule("code", HERO_TIMELINE.code);
    schedule("running", HERO_TIMELINE.running);
    schedule("pass", HERO_TIMELINE.pass);
    schedule("done", HERO_TIMELINE.done);

    const settleOnHide = () => {
      if (document.visibilityState !== "hidden") return;
      timers.forEach((timer) => window.clearTimeout(timer));
      setPhase("done");
    };

    document.addEventListener("visibilitychange", settleOnHide);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.removeEventListener("visibilitychange", settleOnHide);
    };
  }, [reduceMotion]);

  return phase;
}
