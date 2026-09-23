import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, Circle, CircleDot, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { readableInk } from "@/lib/colorUtils";
import type { CoggleNodeData, CoggleSide, NodeStatus } from "@/types/roadmapGraph";

/** Which handle ids a node in direction `side` needs. */
const HANDLES_FOR: Record<CoggleSide, { target: Position; source: Position; targetId: string; sourceId: string }> = {
  right: { target: Position.Left, source: Position.Right, targetId: "target-left", sourceId: "source-right" },
  left: { target: Position.Right, source: Position.Left, targetId: "target-right", sourceId: "source-left" },
  down: { target: Position.Top, source: Position.Bottom, targetId: "target-top", sourceId: "source-bottom" },
  up: { target: Position.Bottom, source: Position.Top, targetId: "target-bottom", sourceId: "source-top" },
};

function CoggleNodeImpl({ data, selected }: NodeProps<{ data: CoggleNodeData }>) {
  const {
    id,
    title,
    side,
    isCollapsed,
    hasChildren,
    childCount = 0,
    branchColor,
    pillWidth,
    matchedSearch,
    statusHidden,
    onToggleCollapse,
    onSelect,
  } = data;

  // Retrieve status from engine data or default to not-started
  const status = ((data as Record<string, unknown>).status as NodeStatus) || "not-started";
  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(id);
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCollapse?.(id);
  };

  // Pastel branches always take dark ink — matches the reference diagram
  const ink = readableInk(branchColor);
  const hasDarkInk = ink.toLowerCase() !== "#ffffff";
  const chipIdle = hasDarkInk
    ? "bg-black/15 text-current hover:bg-black/30"
    : "bg-white/30 text-white hover:bg-white/45";

  const handles = HANDLES_FOR[side] ?? HANDLES_FOR.right;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(id);
        }
      }}
      aria-label={`${title} — ${status}. Click for details.`}
      className={cn(
        "coggle-topic-node group relative flex h-[62px] cursor-pointer select-none items-center gap-2.5 rounded-full pl-4 pr-4 transition-[opacity,box-shadow] duration-200",
        matchedSearch === false && "opacity-25 grayscale hover:opacity-80 transition-opacity",
        statusHidden && "opacity-20 pointer-events-none"
      )}
      style={
        {
          width: pillWidth && pillWidth > 0 ? pillWidth : undefined,
          background: branchColor,
          color: ink,
          boxShadow: selected
            ? `0 0 0 2px #f4f6f2, 0 0 0 4px ${branchColor}, 0 8px 20px -8px rgb(0 0 0 / 0.45)`
            : matchedSearch === true
              ? `0 0 0 2px #f4f6f2, 0 0 0 4px ${branchColor}, 0 6px 18px -8px rgb(0 0 0 / 0.4)`
              : `0 5px 14px -5px rgb(0 0 0 / 0.5)`,
        } as React.CSSProperties
      }
    >
      {/* Hover/selected sheen — an overlay instead of a filter so the text
          stays on the base raster layer (filters force GPU promotion → blur) */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full bg-white transition-opacity duration-150",
          selected ? "opacity-[0.16]" : "opacity-0 group-hover:opacity-[0.13]"
        )}
      />

      {/* Status icon — oversized so it stays visible at far zoom */}
      <span
        className={cn(
          "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-opacity",
          !isCompleted && !isInProgress && "opacity-45"
        )}
        title={`Status: ${status}`}
      >
        {isCompleted ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/95">
            <Check size={14} strokeWidth={3.5} style={{ color: branchColor }} />
          </span>
        ) : isInProgress ? (
          <CircleDot size={17} strokeWidth={2.75} className="animate-pulse" />
        ) : (
          <Circle size={15} strokeWidth={2.25} />
        )}
      </span>

      <h4 className="relative min-w-0 flex-1 truncate text-[18px] font-bold leading-none tracking-[-0.01em]">
        {title}
      </h4>

      {/* Expand / Collapse chip — at rest only when collapsed; otherwise on hover */}
      {hasChildren && (
        <button
          type="button"
          onClick={handleToggleCollapse}
          title={isCollapsed ? `Expand ${childCount} topics` : "Collapse branch"}
          aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          className={cn(
            "relative flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-[13px] font-bold transition-all duration-150",
            isCollapsed
              ? "bg-white/95 scale-105 opacity-100"
              : cn(chipIdle, "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")
          )}
          style={isCollapsed ? { color: branchColor } : undefined}
        >
          {isCollapsed ? (
            <span>+{childCount}</span>
          ) : (
            <Minus size={14} strokeWidth={3} />
          )}
        </button>
      )}

      {/* Handles for this direction (hidden structurally — ribbons attach here) */}
      <Handle
        id={handles.targetId}
        type="target"
        position={handles.target}
        className="!w-2 !h-2"
        style={{ background: branchColor }}
      />
      <Handle
        id={handles.sourceId}
        type="source"
        position={handles.source}
        className="!w-2 !h-2"
        style={{ background: branchColor }}
      />
    </div>
  );
}

export const CoggleNode = memo(CoggleNodeImpl);
