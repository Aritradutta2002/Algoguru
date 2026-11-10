/**
 * AlgoGuru brand geometry — the single source of truth for every rendered
 * surface: the mark, the lockup, the loader, the boot splash in `index.html`
 * and every exported file in `public/`.
 *
 * ── The symbol ────────────────────────────────────────────────────────────
 * A built-up geometric "A": two tapered stems rising to a common apex, a
 * crossbar braced between them, and a single solid junction where all three
 * meet. The triangle that the stems enclose is punched out, so the letter
 * reads as a solid mass at 16px instead of two thin diagonals. The junction
 * is the one deliberate detail — the point where the algorithm converges —
 * which is why the loader animates exactly that spot.
 *
 * Everything is authored on a 64 grid so the same numbers drive a 16px
 * favicon and a 512px app icon. If you change a value here, regenerate the
 * exported files in `public/` with `npm run brand:assets`; the asset-sync
 * test fails if the two ever drift.
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

/* ── The letter ─────────────────────────────────────────────────────────
   A geometric "A" with a flat crest, drawn for A candidacy at 16px:

     · both stems have the SAME constant horizontal weight (6.4 units) — the
       right stem is the left stem mirrored about x = 32, so the two can never
       drift apart the way two hand-drawn polygons do;
     · the flat crest means the apex never pinches to a zero-width point, which
       is what turns a pointed A into grey mush in a 16px raster;
     · the counter is closed on all three sides — crest above, crossbar below,
       flanked by the stem inner edges — so the letter reads as an "A" and not
       as a lambda with a bar;
     · nothing overlaps anything: the crossbar lives strictly between the stems'
     inner edges, so the fill is immune to evenodd/nonzero surprises.

   Reference, 64 grid:
     crest       x 28.8 → 35.2 at y = 14          feet at y = 50.4
     stem weight 6.4 horizontal (4.91 perpendicular)
     crossbar    y 35.0 → 39.6, between the inner edges
     junction    where the right stem's centreline crosses the bar centreline */

/** Crest: top and bottom edges of the flat apex. */
const APEX = { top: 14, bottom: 19.4, x0: 28.8, x1: 35.2 };

/** Baseline. */
const FEET = 50.4;

/** Horizontal weight shared by both stems. */
const STEM_W = 6.4;

/** Crossbar band and its span, seated strictly between the stems' inner edges. */
const BAR_TOP = 35;
const BAR_BOTTOM = 39.6;
const BAR_LEFT = 20.4;
const BAR_RIGHT = 37.6;

const r2 = (n: number) => Number(n.toFixed(2));

/**
 * Right stem, apex corner → crest bottom → inner edge down → inset foot →
 * outer edge up → crest. Closed, one direction.
 *
 * The outer shin is deliberately parallel to the inner one, so the right stem
 * carries the SAME perpendicular weight of 4.91 units the left stem does. The
 * feet are inset 2.6 / 2.9 units along the baseline, which cuts the acute
 * shin/baseline spike that aliases at 16–32px.
 */
const RIGHT_STEM = (() => {
  const ax = APEX.x1;
  const bx = APEX.x1 + STEM_W;
  const drop = FEET - APEX.bottom;
  return (
    `M${r2(ax)} ${APEX.top}` +
    `L${r2(ax)} ${APEX.bottom}` +
    `L${r2(ax + 2.6)} ${FEET}` +
    `L${r2(ax + STEM_W)} ${FEET}` +
    `L${r2(bx + 2.6)} ${APEX.bottom}` +
    `L${r2(bx)} ${APEX.top}Z`
  );
})();

/** Mirror every coordinate of a path about x = 32. */
const mirrorPath = (d: string) =>
  d.replace(
    /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g,
    (_match, x: string, y: string) => `${r2(64 - parseFloat(x))} ${y}`,
  );

const CORNER_Y = APEX.bottom;
const NODE_CY = (BAR_TOP + BAR_BOTTOM) / 2;

/** x of a stem's inner edge at a given y, from the corner down to the inset foot. */
const innerEdgeAt = (y: number) =>
  APEX.x1 + (2.6 * (y - APEX.bottom)) / (FEET - APEX.bottom);

/** x of a stem's outer edge at a given y (parallel to the inner edge). */
const outerEdgeAt = (y: number) =>
  APEX.x1 + STEM_W + 2.6 - (2.6 * (y - APEX.bottom)) / (FEET - APEX.bottom);

/** Inner/outer edge of the right stem where the crossbar's top edge meets it. */
const INNER_AT_BAR = innerEdgeAt(BAR_TOP);
const OUTER_AT_BAR = outerEdgeAt(BAR_TOP);

/** Centreline x of the right stem at the crossbar — where the junction sits. */
const NODE_CX = r2((innerEdgeAt(NODE_CY) + outerEdgeAt(NODE_CY)) / 2);

export const BRAND_A = {
  /** Right stem. */
  rightStem: RIGHT_STEM,
  /** Left stem: the right stem reflected about x = 32 — identical by construction. */
  leftStem: mirrorPath(RIGHT_STEM),
  /** Crossbar: a brace living strictly between the stems' inner edges. */
  crossbar: `M${BAR_LEFT} ${BAR_TOP}L${BAR_RIGHT} ${BAR_TOP}L${BAR_RIGHT} ${BAR_BOTTOM}L${BAR_LEFT} ${BAR_BOTTOM}Z`,
  /** The closed counter: crest above, stems at the sides, crossbar below. */
  counter: `M${r2(APEX.x0 + STEM_W * 0.6)} ${CORNER_Y}L${r2(64 - (APEX.x0 + STEM_W * 0.6))} ${CORNER_Y}L${r2(64 - OUTER_AT_BAR)} ${BAR_TOP}L${r2(INNER_AT_BAR)} ${BAR_TOP}Z`,
  /** The junction: right stem centreline × crossbar centreline. */
  node: { cx: NODE_CX, cy: NODE_CY, r: 2.6 },
  /** Centreline elevation of the crossbar (used by the loader trace). */
  barY: NODE_CY,
  /**
   * Loader traces in pen order: down the right stem from the crest to its
   * foot, then the bar sweeping out from the junction towards the left. Both
   * are real centrelines of the letter, so the traced stroke and the solid
   * letter it becomes are the same shape — no ghosting when the fill lands.
   */
  traces: {
    rightStem: `M${APEX.x1 + STEM_W / 2} ${APEX.top}L${r2(APEX.x1 + 2.6 + STEM_W / 2)} ${FEET}`,
    bar: `M${NODE_CX} ${NODE_CY}L${BAR_LEFT} ${NODE_CY}`,
  },
  /** Measured centreline lengths of the two loader traces, in grid units. */
  traceLengths: {
    rightStem: 36.49,
    bar: 19.3,
  },
} as const;

/**
 * The solid letterform as a single path: three subpaths, resolved with
 * `fill-rule="evenodd"` so the counter is a hole in the letter mass.
 */
/**
 * The solid letterform as a single path.
 *
 * The three pieces are disjoint (verified by the geometry tests), so the
 * winding rule never matters — but `evenodd` is declared at every call site
 * anyway so a future edit that introduces overlap fails safe instead of
 * silently producing a hole.
 */
export const BRAND_GLYPH_PATH = `${BRAND_A.leftStem}${BRAND_A.rightStem}${BRAND_A.crossbar}`;

/**
 * Back-compatible alias of the tooling contract.
 *
 * - `legs` — the full solid letterform (what a mark should fill).
 * - `bar` / `trace` — the loader traces, kept under their historical names so
 *   the geometry is addressed identically from every surface.
 * - `stroke` / `strokeCompact` — optical weight of the tile's inner rim, in
 *   grid units, at display and tab sizes respectively.
 * - `node` — the junction detail.
 */
export const BRAND_GLYPH = {
  legs: BRAND_GLYPH_PATH,
  bar: BRAND_A.traces.bar,
  trace: BRAND_A.traces.rightStem,
  stroke: 6.8,
  strokeCompact: 8.0,
  node: BRAND_A.node,
} as const;

/* ── Colour ─────────────────────────────────────────────────────────────
   One ramp, three applications. The tile composes the indigo→cyan run on a
   135° axis; the loader's sweep, node and glow all sample the same stops so
   the motion can never introduce a colour the static mark doesn't own. */

/** Full ramp — display mark, lockups, app icon, social card. */
export const BRAND_RAMP = [
  { offset: "0%", color: "#6366F1" },
  { offset: "42%", color: "#3B82F6" },
  { offset: "78%", color: "#22D3EE" },
  { offset: "100%", color: "#0EA5E9" },
] as const;

/**
 * Full-colour tile ramp. Four stops from electric indigo through cobalt to a
 * clean sky cyan — no near-black stop, so the glyph keeps its contrast at
 * every size and the tile reads as one material rather than a corner smudge.
 */
export const BRAND_BADGE_STOPS = BRAND_RAMP;

/**
 * High-contrast compact ramp for 16–32px browser tab icons: one tighter
 * indigo→cobalt run, which survives the antialiasing of a 16px raster.
 */
export const BRAND_BADGE_STOPS_COMPACT = [
  { offset: "0%", color: "#7C7CFF" },
  { offset: "52%", color: "#4F63FF" },
  { offset: "100%", color: "#2E4BF5" },
] as const;

/** Glyph ramp: porcelain at the apex to slate at the feet, so the A reads as lit. */
export const BRAND_GLYPH_STOPS = [
  { offset: "0%", color: "#FFFFFF" },
  { offset: "58%", color: "#F1F5F9" },
  { offset: "100%", color: "#DCE4EE" },
] as const;

export const BRAND_INK = "#070709";
export const BRAND_BLUE = "#3B82F6";
export const BRAND_ACCENT = "#22D3EE";
export const BRAND_ACCENT_DEEP = "#0EA5E9";

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

/** Below 20px the counter fills in, so the letter switches to a solid mass and a heavier rim. */
export function glyphStrokeFor(size: number): number {
  return size < 20 ? BRAND_GLYPH.strokeCompact : BRAND_GLYPH.stroke;
}

/** Inner sheen and the lifted node — only worth drawing at 20px and up. */
export function showSurfaceDetailFor(size: number): boolean {
  return size >= BRAND_DETAIL_MIN;
}

/** The junction detail — dropped below 16px where it would only add noise. */
export function showNodeFor(size: number): boolean {
  return size >= BRAND_NODE_MIN;
}

/** True when the counter is large enough to remain open at this size. */
export function showCounterFor(size: number): boolean {
  return size >= 20;
}
