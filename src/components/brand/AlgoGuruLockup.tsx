import { useId } from "react";
import { cn } from "@/lib/utils";

export interface AlgoGuruLockupProps {
  /** Lockup height in px. Width is derived from the lockup's aspect ratio. */
  size?: number;
  orientation?: "horizontal" | "stacked";
  className?: string;
  /** Accessible name. Pass `null` when a neighbouring text label already names the brand. */
  title?: string | null;
}

/* Lockup canvases — see public/brand/*.svg for the matching standalone files. */
const HORIZONTAL = { w: 264, h: 64 };
const STACKED = { w: 200, h: 180 };

const WORDMARK_FONT = "'Space Grotesk','Outfit','Inter',system-ui,sans-serif";

/**
 * "Algo" inherits `currentColor` so the lockup adapts to light/dark surfaces;
 * "Guru" stays on-brand orange in both.
 */
export function AlgoGuruLockup({
  size = 40,
  orientation = "horizontal",
  className,
  title = "AlgoGuru",
}: AlgoGuruLockupProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `ag-lock-grad-${uid}`;
  const maskId = `ag-lock-mask-${uid}`;

  const canvas = orientation === "horizontal" ? HORIZONTAL : STACKED;
  const width = (size * canvas.w) / canvas.h;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${canvas.w} ${canvas.h}`}
      width={width}
      height={size}
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FB923C" />
          <stop offset="1" stopColor="#E1542F" />
        </linearGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <g fill="#000">
            <circle cx="17" cy="46" r="2.2" />
            <circle cx="32" cy="18" r="2.4" />
            <circle cx="47" cy="46" r="2.2" />
            <circle cx="22.09" cy="36.5" r="1.8" />
            <circle cx="41.91" cy="36.5" r="1.8" />
          </g>
        </mask>
      </defs>

      {orientation === "horizontal" ? (
        <>
          <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
          <g
            mask={`url(#${maskId})`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 46 L32 18 L47 46" />
            <path d="M22.09 36.5 H41.91" />
          </g>
          <text
            x="84"
            y="44"
            fontFamily={WORDMARK_FONT}
            fontSize={34}
            fontWeight={600}
            letterSpacing="-0.6"
          >
            <tspan fill="currentColor">Algo</tspan>
            <tspan fill="#E1542F">Guru</tspan>
          </text>
        </>
      ) : (
        <>
          <g transform="translate(52 4) scale(1.5)">
            <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
            <g
              mask={`url(#${maskId})`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 46 L32 18 L47 46" />
              <path d="M22.09 36.5 H41.91" />
            </g>
          </g>
          <text
            x="100"
            y="158"
            textAnchor="middle"
            fontFamily={WORDMARK_FONT}
            fontSize={38}
            fontWeight={600}
            letterSpacing="-0.8"
          >
            <tspan fill="currentColor">Algo</tspan>
            <tspan fill="#E1542F">Guru</tspan>
          </text>
        </>
      )}
    </svg>
  );
}

export default AlgoGuruLockup;
