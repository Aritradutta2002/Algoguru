import { useId } from "react";
import { cn } from "@/lib/utils";

export type AlgoGuruMarkVariant = "gradient" | "mono" | "reverse" | "knockout";

export interface AlgoGuruMarkProps {
  /** Rendered width/height in px (the mark is square). */
  size?: number;
  /**
   * - gradient : full-colour badge (default) — use on light or dark surfaces
   * - mono     : flat ink badge + white glyph — one-colour printing
   * - reverse  : flat white badge + ink glyph — dark surfaces, one-colour
   * - knockout : no badge, glyph in currentColor — for placing inside a tinted tile
   */
  variant?: AlgoGuruMarkVariant;
  /** Force node knockouts on/off. Default: automatic (dropped below 24px for crispness). */
  detail?: boolean;
  className?: string;
  /** Accessible name. Pass `null` when the mark is purely decorative. */
  title?: string | null;
}

/* ── Geometry ──────────────────────────────────────────────────
   Authored on a 64 grid. The glyph (with stroke caps) spans x 14–50 and
   y 15–49, so it is optically centred at (32, 32) inside the badge.
   The 5 nodes sit on the graph vertices: 2 feet, apex, 2 crossbar junctions. */
const NODES = [
  { cx: 17, cy: 46, r: 2.2 },
  { cx: 32, cy: 18, r: 2.4 },
  { cx: 47, cy: 46, r: 2.2 },
  { cx: 22.09, cy: 36.5, r: 1.8 },
  { cx: 41.91, cy: 36.5, r: 1.8 },
] as const;

const LEGS = "M17 46 L32 18 L47 46";
const BAR = "M22.09 36.5 H41.91";

const BADGE_FILL: Record<AlgoGuruMarkVariant, string> = {
  gradient: "", // replaced at render with url(#id)
  mono: "#0B0F14",
  reverse: "#FFFFFF",
  knockout: "none",
};

export function AlgoGuruMark({
  size = 32,
  variant = "gradient",
  detail,
  className,
  title = "AlgoGuru",
}: AlgoGuruMarkProps) {
  // useId keeps gradient/mask ids unique when several marks render at once.
  const uid = useId().replace(/:/g, "");
  const gradId = `ag-grad-${uid}`;
  const maskId = `ag-mask-${uid}`;

  // A node knockout is ~0.55px at 16px — drop them on small sizes so the glyph stays crisp.
  const showNodes = detail ?? size >= 24;

  const badgeFill = variant === "gradient" ? `url(#${gradId})` : BADGE_FILL[variant];

  const glyphStroke =
    variant === "reverse" ? "#0B0F14" : variant === "knockout" ? "currentColor" : "#FFFFFF";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        {variant === "gradient" && (
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FB923C" />
            <stop offset="1" stopColor="#E1542F" />
          </linearGradient>
        )}
        {showNodes && (
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
            <rect width="64" height="64" fill="#fff" />
            <g fill="#000">
              {NODES.map((n, i) => (
                <circle key={i} cx={n.cx} cy={n.cy} r={n.r} />
              ))}
            </g>
          </mask>
        )}
      </defs>

      {variant !== "knockout" && <rect width="64" height="64" rx="16" fill={badgeFill} />}

      <g
        mask={showNodes ? `url(#${maskId})` : undefined}
        fill="none"
        stroke={glyphStroke}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={LEGS} />
        <path d={BAR} />
      </g>
    </svg>
  );
}

export default AlgoGuruMark;
