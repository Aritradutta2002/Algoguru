import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { NodeStatus } from "@/types/roadmapGraph";

export interface RoadmapEdgeData extends Record<string, unknown> {
  /** Status of the target node. Drives edge styling. */
  targetStatus: NodeStatus;
  /** Whether the source or target node is currently hovered. */
  isHovered?: boolean;
  /** Which way the dash-stream should run when this edge is hovered. */
  flowDirection?: "forward" | "backward";
}

/**
 * Custom React Flow edge used between roadmap nodes.
 * - bezier path for that classic NeetCode look
 * - dimmed when the target is locked (has unresolved prereqs)
 * - on hover, the base stroke itself becomes a flowing dash stream: a
 *   `stroke-dasharray` + inline `animation` referencing the
 *   @keyframes defined in src/index.css (`roadmap-flow-forward` /
 *   `roadmap-flow-backward`) loops `stroke-dashoffset` infinitely,
 *   producing the "energy flowing along the line" effect.
 *   Inline style is used (not a CSS class) so the animation always
 *   wins over React Flow's own edge-path specificity.
 */
function RoadmapEdgeImpl(props: EdgeProps) {
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

  const targetStatus = (data as RoadmapEdgeData | undefined)?.targetStatus ?? "not-started";
  const isHovered = (data as RoadmapEdgeData | undefined)?.isHovered ?? false;
  const flowDirection =
    (data as RoadmapEdgeData | undefined)?.flowDirection ?? "forward";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const stroke =
    isHovered
      ? "hsl(var(--primary))" // Blue flowing stroke when hovered
      : targetStatus === "completed"
      ? "hsl(var(--success))"
      : targetStatus === "in-progress"
      ? "hsl(var(--primary))"
      : "hsl(var(--muted-foreground))"; // More visible bolder grey

  const opacity =
    isHovered ? 1 : targetStatus === "not-started" ? 0.6 : targetStatus === "in-progress" ? 0.9 : 1;

  return (
    <>
      {/* Base "rail" — solid colored stroke that gives the edge its weight
          and color. On hover, the `.animated` class is added which
          (per the rules defined in src/index.css at the bottom of the
          file) sets `stroke-dasharray: 10 10` and runs the
          `rm-edge-dash` @keyframes animation infinitely — producing
          the flowing dash stream effect. */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeWidth: selected || isHovered ? 4.5 : 3,
          opacity,
          transition:
            "stroke 200ms ease, opacity 200ms ease, stroke-width 200ms ease",
        }}
        className={cn(
          isHovered && "animated",
          targetStatus === "completed" && "[stroke-linecap:round]"
        )}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "none",
          }}
          className="nodrag nopan"
        />
      </EdgeLabelRenderer>
    </>
  );
}

export const RoadmapEdge = memo(RoadmapEdgeImpl);
