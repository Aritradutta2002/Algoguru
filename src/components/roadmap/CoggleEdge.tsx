import { memo } from "react";
import { BaseEdge, type EdgeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { getTaperedRibbonPath, getBranchCenterlinePath } from "./edgePath";
import type { CoggleEdgeData } from "@/types/roadmapGraph";

/** Ribbon widths per tier: [near source, near target] — chunky trunk → thin tip. */
const TIER_WIDTHS: Record<number, [number, number]> = {
  1: [20, 8],
  2: [14, 5.5],
  3: [10, 4],
  4: [7.5, 3.5],
};

function CoggleEdgeImpl(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  } = props;

  const edgeData = data as CoggleEdgeData | undefined;
  const branchColor = edgeData?.branchColor || "#7BA7F8";
  const tier = edgeData?.tier ?? 2;
  const isHovered = edgeData?.isHovered ?? false;
  const isActivePath = edgeData?.isActivePath ?? false;
  const isHighlighted = selected || isHovered || isActivePath;

  const [startWidth, endWidth] = TIER_WIDTHS[tier] ?? [7, 3];

  const ribbonPath = getTaperedRibbonPath(
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    startWidth,
    endWidth,
  );

  // Invisible hit-area following the exact same curve as the ribbon
  const hitPath = getBranchCenterlinePath(
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  );

  return (
    <>
      <path
        id={id}
        d={ribbonPath}
        fill={branchColor}
        stroke={branchColor}
        strokeWidth={0.75}
        strokeLinejoin="round"
        className={cn("coggle-edge-ribbon", isHighlighted && "coggle-edge-highlighted")}
        style={{
          color: branchColor,
          opacity: isHighlighted ? 1 : 0.92,
          transition: "opacity 200ms ease, filter 200ms ease",
        }}
      />
      <BaseEdge
        id={`${id}-hit`}
        path={hitPath}
        style={{ stroke: "transparent", strokeWidth: 16, fill: "none" }}
      />
    </>
  );
}

export const CoggleEdge = memo(CoggleEdgeImpl);
