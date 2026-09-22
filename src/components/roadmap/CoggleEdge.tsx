import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { CoggleEdgeData } from "@/types/roadmapGraph";

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
  const branchColor = edgeData?.branchColor || "hsl(var(--primary))";
  const tier = edgeData?.tier ?? 2;
  const isHovered = edgeData?.isHovered ?? false;
  const isActivePath = edgeData?.isActivePath ?? false;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.45,
  });

  // Tapered stroke width depending on hierarchy tier
  const baseWidth =
    tier === 1 ? 3.6 : tier === 2 ? 2.5 : 1.9;
  const strokeWidth = selected || isHovered || isActivePath ? baseWidth + 1.2 : baseWidth;

  const isHighlighted = selected || isHovered || isActivePath;

  return (
    <>
      {/* Outer glow aura when hovered / active */}
      {isHighlighted && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: branchColor,
            strokeWidth: strokeWidth + 4,
            opacity: 0.35,
            filter: `blur(4px)`,
          }}
        />
      )}

      {/* Main branch curve */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: branchColor,
          strokeWidth,
          opacity: isHighlighted ? 1 : 0.85,
          strokeLinecap: "round",
          transition: "stroke 200ms ease, stroke-width 200ms ease, opacity 200ms ease",
          ...(isHighlighted
            ? {
                strokeDasharray: "6 4",
                animation: "coggle-edge-flow 1.2s linear infinite",
              }
            : {}),
        }}
        className={cn("coggle-edge-path", isHighlighted && "coggle-edge-highlighted")}
      />
    </>
  );
}

export const CoggleEdge = memo(CoggleEdgeImpl);
