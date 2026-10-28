import { useMemo } from "react";
import { GuruAvatar } from "@/components/brand/GuruMark";
import { cn } from "@/lib/utils";

const PHRASES = [
  "Reading your message",
  "Mapping out an answer",
  "Checking the approach",
  "Reasoning through this",
  "Putting the pieces together",
  "Drafting a response",
];

/**
 * Pre-token state. Uses the mascot rather than three generic bouncing dots so
 * the wait still feels like Guru — and so the panel reads as alive without
 * animating layout.
 */
export function GuruThinking({
  elapsedMs = 0,
  className,
}: {
  elapsedMs?: number;
  className?: string;
}) {
  // A stable offset per mount so consecutive requests don't all start on the
  // same phrase, without shuffling on every render.
  const phrase = useMemo(
    () => PHRASES[Math.floor(Math.random() * PHRASES.length)],
    [],
  );
  const seconds = Math.floor(elapsedMs / 1000);

  return (
    <div
      className={cn("flex items-start gap-2.5", className)}
      aria-live="polite"
      aria-label="Guru is thinking"
    >
      <GuruAvatar size={26} mood="thinking" ring className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[12px] font-semibold text-guru-text">GuruBot</span>
          <span className="text-[11px] text-guru-muted">
            thinking{seconds > 0 ? ` · ${seconds}s` : "…"}
          </span>
        </div>
        <div className="rounded-xl rounded-tl-sm border border-guru-line/70 bg-guru-surface/60 px-3.5 py-3">
          <p key={phrase} className="animate-fade-in text-[13px] text-guru-muted">
            {phrase}
          </p>
          <div className="mt-2.5 space-y-1.5" aria-hidden="true">
            {[100, 82, 58].map((width) => (
              <div
                key={width}
                className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                style={{ width: `${width}%` }}
              >
                <div className="absolute inset-0 animate-guru-shimmer bg-gradient-to-r from-transparent via-guru-accent/35 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
