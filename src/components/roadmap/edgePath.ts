import { Position } from "@xyflow/react";

const SAMPLES = 24;

interface BezierControls {
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
}

/**
 * Cubic bezier control points for a Coggle branch.
 *
 * Orientation is decided by the HANDLE sides (not by which distance is
 * larger): a Top/Bottom handle always bends along Y, a Left/Right handle
 * always bends along X. The distance-based rule the original mirrored from
 * React Flow produced straight lines for the radial up/down wings whenever
 * the horizontal spread exceeded the vertical gap.
 */
function controlsFor(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
  targetPosition: Position,
  curvature: number,
): BezierControls {
  const vertical =
    sourcePosition === Position.Top ||
    sourcePosition === Position.Bottom ||
    targetPosition === Position.Top ||
    targetPosition === Position.Bottom;

  let c1x = sourceX;
  let c1y = sourceY;
  let c2x = targetX;
  let c2y = targetY;

  if (vertical) {
    const distanceY = Math.abs(sourceY - targetY) || 80;
    const yOffset = distanceY * curvature;
    if (sourcePosition === Position.Bottom) c1y = sourceY + yOffset;
    else if (sourcePosition === Position.Top) c1y = sourceY - yOffset;
    if (targetPosition === Position.Bottom) c2y = targetY + yOffset;
    else if (targetPosition === Position.Top) c2y = targetY - yOffset;
  } else {
    const distanceX = Math.abs(sourceX - targetX) || 80;
    const xOffset = distanceX * curvature;
    if (sourcePosition === Position.Right) c1x = sourceX + xOffset;
    else if (sourcePosition === Position.Left) c1x = sourceX - xOffset;
    if (targetPosition === Position.Right) c2x = targetX + xOffset;
    else if (targetPosition === Position.Left) c2x = targetX - xOffset;
  }

  return { c1x, c1y, c2x, c2y };
}

function cubicAt(
  t: number,
  p0: number,
  c1: number,
  c2: number,
  p1: number,
): number {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 + 3 * mt * mt * t * c1 + 3 * mt * t * t * c2 + t * t * t * p1
  );
}

function cubicDerivAt(
  t: number,
  p0: number,
  c1: number,
  c2: number,
  p1: number,
): number {
  const mt = 1 - t;
  return (
    3 * mt * mt * (c1 - p0) + 6 * mt * t * (c2 - c1) + 3 * t * t * (p1 - c2)
  );
}

/**
 * Stroke path of the branch's centerline — same curve the ribbon uses,
 * kept for the invisible hit-area so hover focus tracks the visible branch.
 */
export function getBranchCenterlinePath(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
  targetPosition: Position,
  curvature = 0.45,
): string {
  const { c1x, c1y, c2x, c2y } = controlsFor(
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  );

  return `M ${sourceX.toFixed(2)},${sourceY.toFixed(2)} C ${c1x.toFixed(
    2
  )},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${targetX.toFixed(
    2
  )},${targetY.toFixed(2)}`;
}

/**
 * Build a closed, filled path of a branch that tapers from `startWidth`
 * near the source to `endWidth` at the target — Coggle's organic ribbon.
 */
export function getTaperedRibbonPath(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
  targetPosition: Position,
  startWidth: number,
  endWidth: number,
  curvature = 0.45,
): string {
  const { c1x, c1y, c2x, c2y } = controlsFor(
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  );

  const left: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];

  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const x = cubicAt(t, sourceX, c1x, c2x, targetX);
    const y = cubicAt(t, sourceY, c1y, c2y, targetY);
    const dx = cubicDerivAt(t, sourceX, c1x, c2x, targetX);
    const dy = cubicDerivAt(t, sourceY, c1y, c2y, targetY);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    // Ease the width along the curve so the taper feels organic
    const w = startWidth + (endWidth - startWidth) * t;
    const half = Math.max(w, 0.6) / 2;
    left.push([x + nx * half, y + ny * half]);
    right.push([x - nx * half, y - ny * half]);
  }

  const fmt = (p: [number, number]) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const parts: string[] = [`M ${fmt(left[0])}`];
  for (let i = 1; i < left.length; i++) parts.push(`L ${fmt(left[i])}`);
  // Rounded cap at the tip
  parts.push(`L ${fmt(right[right.length - 1])}`);
  for (let i = right.length - 2; i >= 0; i--) parts.push(`L ${fmt(right[i])}`);
  parts.push("Z");
  return parts.join(" ");
}
