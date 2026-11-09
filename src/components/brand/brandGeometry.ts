/**
 * AlgoGuru brand geometry — the single source of truth for every rendered
 * surface (mark, lockup, loader, splash, icon exports).
 *
 * The symbol: a bold geometric "A" on a superellipse tile, lit from the
 * top-left with a cyan bloom rising from the bottom-right corner. The only
 * ornament is a single node seated on the crossbar — the "guru" mark on the
 * path — and it is dropped below 32px where it would only add noise.
 *
 * Everything is authored on a 64 grid so the ratios translate directly from a
 * 16px favicon to a 512px app icon. If you change a value here, regenerate the
 * exported files in `public/` with `npm run brand:assets`.
 */

export const BRAND_VIEWBOX = 64;

/**
 * Superellipse (n = 4.6) sampled as a closed path. A rounded rect has a
 * visible curvature break where the corner arc meets the straight edge; this
 * has continuous curvature, which is what makes an app icon read as an object
 * rather than a decorated square.
 */
export const BRAND_TILE_PATH =
  "M64.00 32.00L63.98 40.63L63.93 43.66L63.85 45.89L63.73 47.72L63.58 49.30L63.39 50.69L63.17 51.94L62.92 53.08L62.63 54.12L62.30 55.08L61.93 55.96L61.53 56.78L61.09 57.55L60.61 58.26L60.09 58.91L59.52 59.52L58.91 60.09L58.26 60.61L57.55 61.09L56.78 61.53L55.96 61.93L55.08 62.30L54.12 62.63L53.08 62.92L51.94 63.17L50.69 63.39L49.30 63.58L47.72 63.73L45.89 63.85L43.66 63.93L40.63 63.98L32.00 64.00L23.37 63.98L20.34 63.93L18.11 63.85L16.28 63.73L14.70 63.58L13.31 63.39L12.06 63.17L10.92 62.92L9.88 62.63L8.92 62.30L8.04 61.93L7.22 61.53L6.45 61.09L5.74 60.61L5.09 60.09L4.48 59.52L3.91 58.91L3.39 58.26L2.91 57.55L2.47 56.78L2.07 55.96L1.70 55.08L1.37 54.12L1.08 53.08L0.83 51.94L0.61 50.69L0.42 49.30L0.27 47.72L0.15 45.89L0.07 43.66L0.02 40.63L0.00 32.00L0.02 23.37L0.07 20.34L0.15 18.11L0.27 16.28L0.42 14.70L0.61 13.31L0.83 12.06L1.08 10.92L1.37 9.88L1.70 8.92L2.07 8.04L2.47 7.22L2.91 6.45L3.39 5.74L3.91 5.09L4.48 4.48L5.09 3.91L5.74 3.39L6.45 2.91L7.22 2.47L8.04 2.07L8.92 1.70L9.88 1.37L10.92 1.08L12.06 0.83L13.31 0.61L14.70 0.42L16.28 0.27L18.11 0.15L20.34 0.07L23.37 0.02L32.00 0.00L40.63 0.02L43.66 0.07L45.89 0.15L47.72 0.27L49.30 0.42L50.69 0.61L51.94 0.83L53.08 1.08L54.12 1.37L55.08 1.70L55.96 2.07L56.78 2.47L57.55 2.91L58.26 3.39L58.91 3.91L59.52 4.48L60.09 5.09L60.61 5.74L61.09 6.45L61.53 7.22L61.93 8.04L62.30 8.92L62.63 9.88L62.92 10.92L63.17 12.06L63.39 13.31L63.58 14.70L63.73 16.28L63.85 18.11L63.93 20.34L63.98 23.37Z";

export const BRAND_GLYPH = {
  /** The architectural A monogram: apex at 32, 14; grounded baseline terminals at 16, 50 and 48, 50 */
  legs: "M16 50 L32 14 L48 50",
  /** Same outline as a single continuous trace for the loader. */
  trace: "M16 50 L32 14 L48 50",
  /** Optically balanced crossbar seated at golden-ratio elevation */
  bar: "M22 36 H42",
  /** Stroke weight at display sizes. */
  stroke: 6.8,
  /**
   * Bold stroke below 24px so the glyph survives 16px/32px browser tabs.
   */
  strokeCompact: 8.0,
  /** The Algorithmic Nexus node: seated at the junction where crossbar fuses into right pillar */
  node: { cx: 39.2, cy: 36.0, r: 4.2 },
} as const;

/**
 * Obsidian & Electric Indigo-Sapphire tile gradient:
 * Specular sky cyan rim highlight cascading into electric indigo, vivid cobalt, and obsidian midnight.
 */
export const BRAND_BADGE_STOPS = [
  { offset: "0%", color: "#38BDF8" },
  { offset: "18%", color: "#6366F1" },
  { offset: "48%", color: "#3B82F6" },
  { offset: "78%", color: "#1D4ED8" },
  { offset: "100%", color: "#0B0F19" },
] as const;

/**
 * High-contrast compact ramp for browser tab favicons and micro marks:
 * Luminous electric indigo descending into vivid sapphire for razor-sharp visibility.
 */
export const BRAND_BADGE_STOPS_COMPACT = [
  { offset: "0%", color: "#6366F1" },
  { offset: "45%", color: "#2563EB" },
  { offset: "100%", color: "#1D4ED8" },
] as const;

/** Glyph gradient: diamond platinum warming to crisp slate ice at the baseline */
export const BRAND_GLYPH_STOPS = [
  { offset: "0%", color: "#FFFFFF" },
  { offset: "50%", color: "#F8FAFC" },
  { offset: "100%", color: "#E2E8F0" },
] as const;

export const BRAND_INK = "#070709";
export const BRAND_BLUE = "#3B82F6";
export const BRAND_ACCENT = "#00F5FF";
export const BRAND_ACCENT_DEEP = "#06B6D4";

export const WORDMARK_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

/** Lockup canvases — see public/brand/*.svg for the matching standalone files. */
export const LOCKUP_HORIZONTAL = { w: 268, h: 64 } as const;
export const LOCKUP_STACKED = { w: 200, h: 180 } as const;

/**
 * Thresholds, in rendered px. Below these the layers collapse into a single
 * crisp silhouette instead of turning into mud.
 */
export const BRAND_DETAIL_MIN = 20;
export const BRAND_NODE_MIN = 16;

/** Node knockouts vanish below ~24px, so drop them and thicken the glyph. */
export function glyphStrokeFor(size: number): number {
  return size < 24 ? BRAND_GLYPH.strokeCompact : BRAND_GLYPH.stroke;
}

/** Bloom, gloss, shade, rim and the letter's drop shadow. */
export function showSurfaceDetailFor(size: number): boolean {
  return size >= BRAND_DETAIL_MIN;
}

/** The crossbar node — the one ornament. */
export function showNodeFor(size: number): boolean {
  return size >= BRAND_NODE_MIN;
}
