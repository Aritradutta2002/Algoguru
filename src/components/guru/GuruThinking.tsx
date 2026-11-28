"use client";

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
        <div className="border-l-2 border-guru-accent/25 py-1 pl-3">
          <p key={phrase} className="animate-fade-in text-[13px] text-guru-muted">
            {phrase}
          </p>
        </div>
      </div>
    </div>
  );
}
