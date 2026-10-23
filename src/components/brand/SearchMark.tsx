import { useId } from "react";
import { cn } from "@/lib/utils";

const PRIMARY_FILL = "hsl(var(--primary))";
const INFO_FILL = "hsl(var(--info, 210 80% 52%))";

/**
 * The AlgoGuru search mark: a gradient tile holding a white magnifier with a
 * four-point sparkle breaking out of the top-right of the lens.
 *
 * Drawn rather than taken from lucide so it can carry the brand gradient and
 * stay unique to search. Everything is authored in a 24x24 viewBox and scaled
 * with `size`, so one definition serves the header trigger and the palette.
 *
 * Lives in its own module so the lightweight header launcher can render the
 * mark without pulling the full search index into the initial bundle.
 */
export function SearchMark({ size = 24, className }: { size?: number; className?: string }) {
  // React 18's useId() returns ":r0:" — colons are illegal in a `url(#id)`
  // paint reference, which silently kills the gradient. Strip everything that
  // is not URL-safe.
  const rawId = useId();
  const gradientId = `algoguru-search-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" style={{ stopColor: PRIMARY_FILL }} />
          <stop offset="100%" style={{ stopColor: INFO_FILL }} />
        </linearGradient>
      </defs>

      <rect x="0.5" y="0.5" width="23" height="23" rx="7" fill={`url(#${gradientId})`} />
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="7"
        stroke="hsl(var(--foreground) / 0.14)"
        strokeWidth="1"
      />

      {/* Magnifier */}
      <circle cx="10.6" cy="12.4" r="4.4" stroke="#fff" strokeWidth="1.9" />
      <path d="M13.9 15.7 17.4 19.2" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />

      {/* Sparkle breaking out of the lens */}
      <path
        d="M17.4 3.6Q17.4 7.1 20.9 7.1Q17.4 7.1 17.4 10.6Q17.4 7.1 13.9 7.1Q17.4 7.1 17.4 3.6Z"
        fill="#fff"
        fillOpacity="0.95"
      />
    </svg>
  );
}
