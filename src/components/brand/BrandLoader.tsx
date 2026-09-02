import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import "./brand.css";

export interface BrandLoaderProps {
  /** Mark size in px. */
  size?: number;
  /** Visible status text. Pass `null` for a bare mark (still announced to AT). */
  label?: string | null;
  /** Keep the label for screen readers only. */
  hideLabel?: boolean;
  /** Force the static treatment regardless of the user's motion preference. */
  disableAnimation?: boolean;
  className?: string;
}

/* Geometry is shared with AlgoGuruMark — see that file for the full rationale. */
const NODES = [
  { cx: 17, cy: 46, r: 2.2 },
  { cx: 32, cy: 18, r: 2.4 },
  { cx: 47, cy: 46, r: 2.2 },
  { cx: 22.09, cy: 36.5, r: 1.8 },
  { cx: 41.91, cy: 36.5, r: 1.8 },
] as const;

const LEGS = "M17 46 L32 18 L47 46";
const BAR = "M22.09 36.5 H41.91";

/* Path lengths: legs = 2 x sqrt(15^2 + 28^2), bar = 41.91 - 22.09.
   The dash pattern is "dash, pathLength" so only one dash is ever on the path;
   animating the offset from +dash to -pathLength walks it clear off both ends. */
const TRACES = [
  { d: LEGS, len: 63.53, dash: 16, delay: 0 },
  { d: BAR, len: 19.82, dash: 14, delay: 0 },
] as const;

const cssVars = (vars: Record<string, number | string>) => vars as CSSProperties;

export function BrandLoader({
  size = 48,
  label = "Loading",
  hideLabel = false,
  disableAnimation = false,
  className,
}: BrandLoaderProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `agl-grad-${uid}`;
  const maskId = `agl-mask-${uid}`;

  return (
    <div
      className={cn("agl", hideLabel && "agl--row", disableAnimation && "agl--static", className)}
      role="status"
      aria-live="polite"
    >
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FB923C" />
            <stop offset="1" stopColor="#E1542F" />
          </linearGradient>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
            <rect width="64" height="64" fill="#fff" />
            <g fill="#000">
              {NODES.map((n, i) => (
                <circle key={i} cx={n.cx} cy={n.cy} r={n.r} />
              ))}
            </g>
          </mask>
        </defs>

        <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />

        {/* Dim track — the glyph the trace travels along. */}
        <g
          className="agl__track"
          mask={`url(#${maskId})`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {TRACES.map((t) => (
            <path key={t.d} d={t.d} />
          ))}
        </g>

        {/* Bright signal travelling along each edge. */}
        <g fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
          {TRACES.map((t) => (
            <path
              key={t.d}
              className="agl__trace"
              d={t.d}
              strokeDasharray={`${t.dash} ${t.len}`}
              style={cssVars({ "--agl-from": t.dash, "--agl-to": -t.len, animationDelay: `${t.delay}s` })}
            />
          ))}
        </g>

        {/* Vertices light up as the signal reaches them. */}
        <g fill="#FFFFFF">
          {NODES.map((n, i) => (
            <circle
              key={i}
              className="agl__node"
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              style={cssVars({ animationDelay: `${i * 0.09}s` })}
            />
          ))}
        </g>
      </svg>

      {label ? (
        <span className={cn("agl__label", hideLabel && "sr-only")}>{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

export default BrandLoader;
