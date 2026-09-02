import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandLoader } from "./BrandLoader";

export interface BrandSplashProps {
  /** Drives the fade. The element stays mounted for the duration of the fade-out. */
  visible?: boolean;
  /** Status text shown while everything is on track. */
  label?: string;
  /** After this many ms, soften the message to "still working" so it never feels frozen. */
  slowAfter?: number;
  /** After this many ms, surface the stuck state and (optionally) a retry action. */
  timeoutAfter?: number;
  onRetry?: () => void;
  className?: string;
}

type Phase = "normal" | "slow" | "stuck";

const MESSAGES: Record<Phase, string> = {
  normal: "", // supplied by `label`
  slow: "Still working…",
  stuck: "This is taking longer than usual.",
};

/**
 * Full-screen brand load state.
 *
 * Deliberately degrades in stages rather than spinning forever:
 *   on-track → "still working" → "taking longer than usual" (+ optional retry)
 * so a slow or dead connection always produces an honest message instead of an
 * ambiguous animation.
 */
export function BrandSplash({
  visible = true,
  label = "Loading AlgoGuru",
  slowAfter = 3000,
  timeoutAfter = 10000,
  onRetry,
  className,
}: BrandSplashProps) {
  const [phase, setPhase] = useState<Phase>("normal");
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (!visible) {
      const unmount = window.setTimeout(() => setMounted(false), 320);
      return () => window.clearTimeout(unmount);
    }

    setMounted(true);
    setPhase("normal");

    const slow = window.setTimeout(() => setPhase("slow"), slowAfter);
    const stuck = window.setTimeout(() => setPhase("stuck"), timeoutAfter);

    return () => {
      window.clearTimeout(slow);
      window.clearTimeout(stuck);
    };
  }, [visible, slowAfter, timeoutAfter]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 px-6 text-center",
        "transition-opacity duration-300 ease-out",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
        className
      )}
      style={{ background: "hsl(var(--background))" }}
      role="status"
      aria-live="polite"
    >
      <BrandLoader size={64} label={null} />

      {/* Wordmark set in the brand face — "Guru" carries the brand orange in both themes. */}
      <div
        className="text-xl font-semibold tracking-tight"
        style={{ fontFamily: "'Space Grotesk','Outfit','Inter',system-ui,sans-serif", color: "hsl(var(--foreground))" }}
      >
        <span>Algo</span>
        <span style={{ color: "#E1542F" }}>Guru</span>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {phase === "normal" ? label : MESSAGES[phase]}
      </p>

      {phase === "stuck" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "mt-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default BrandSplash;
