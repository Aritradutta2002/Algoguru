import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, Circle, CircleDot, ChevronDown, ChevronRight, Plus, Minus, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoggleNodeData, NodeStatus } from "@/types/roadmapGraph";

interface CoggleNodeProps extends NodeProps<{ data: CoggleNodeData }> {
  // Custom props from React Flow
}

function CoggleNodeImpl({ data, selected }: CoggleNodeProps) {
  const {
    id,
    title,
    subtitle,
    category,
    resources = 0,
    recommendedOrder,
    side,
    tier,
    isCategory,
    isCollapsed,
    hasChildren,
    childCount = 0,
    branchColor,
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

  // ── 1. CATEGORY TRUNK PILL ─────────────────────────────────────────────
  if (isCategory) {
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
        aria-label={`Category ${title} — ${childCount} topics`}
        className={cn(
          "coggle-category-node group relative flex min-h-[44px] w-[180px] cursor-pointer select-none items-center justify-between rounded-xl px-3 py-1.5 transition-all duration-200",
          "border border-border/80 bg-card/95 shadow-md backdrop-blur-md",
          "hover:scale-[1.03] hover:shadow-lg",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          matchedSearch === false && "opacity-25 grayscale hover:opacity-80 transition-opacity",
          statusHidden && "opacity-20 pointer-events-none"
        )}
        style={{
          borderLeftColor: side === "right" ? branchColor : undefined,
          borderRightColor: side === "left" ? branchColor : undefined,
          borderLeftWidth: side === "right" ? "4px" : "1px",
          borderRightWidth: side === "left" ? "4px" : "1px",
          boxShadow: `0 4px 14px -6px ${branchColor}66`,
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ background: branchColor }}
          >
            <Layers size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs font-bold text-foreground">
              {title}
            </h3>
            <span className="text-[10px] font-medium text-muted-foreground">
              {childCount} topics
            </span>
          </div>
        </div>

        {/* Expand / Collapse badge */}
        {hasChildren && (
          <button
            type="button"
            onClick={handleToggleCollapse}
            title={isCollapsed ? `Expand ${childCount} topics` : "Collapse branch"}
            aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
            className={cn(
              "ml-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
              isCollapsed
                ? "border-primary/50 bg-primary/20 text-primary hover:bg-primary/30 scale-105"
                : "border-border/70 bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {isCollapsed ? (
              <span className="text-[10px] font-bold">+{childCount}</span>
            ) : (
              <Minus size={12} strokeWidth={2.5} />
            )}
          </button>
        )}

        {/* Handles */}
        {side === "right" ? (
          <>
            <Handle
              id="target-left"
              type="target"
              position={Position.Left}
              className="!w-2.5 !h-2.5 !border-2 !border-background !bg-primary transition-transform group-hover:scale-125"
              style={{ background: branchColor }}
            />
            <Handle
              id="source-right"
              type="source"
              position={Position.Right}
              className="!w-2.5 !h-2.5 !border-2 !border-background !bg-primary transition-transform group-hover:scale-125"
              style={{ background: branchColor }}
            />
          </>
        ) : (
          <>
            <Handle
              id="target-right"
              type="target"
              position={Position.Right}
              className="!w-2.5 !h-2.5 !border-2 !border-background !bg-primary transition-transform group-hover:scale-125"
              style={{ background: branchColor }}
            />
            <Handle
              id="source-left"
              type="source"
              position={Position.Left}
              className="!w-2.5 !h-2.5 !border-2 !border-background !bg-primary transition-transform group-hover:scale-125"
              style={{ background: branchColor }}
            />
          </>
        )}
      </div>
    );
  }

  // ── 2. TOPIC NODE CARD ────────────────────────────────────────────────
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
        "coggle-topic-node group relative flex min-h-[64px] w-[204px] cursor-pointer select-none flex-col justify-center rounded-xl p-2.5 transition-all duration-200",
        "border border-border/80 bg-card/90 shadow-md backdrop-blur-md",
        "hover:-translate-y-0.5 hover:shadow-lg",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isCompleted && "border-success/50 bg-success/5",
        isInProgress && "border-warning/50 bg-warning/5",
        matchedSearch === true && "ring-2 ring-primary shadow-[0_0_16px_var(--coggle-accent)]",
        matchedSearch === false && "opacity-25 grayscale hover:opacity-80 transition-opacity",
        statusHidden && "opacity-20 pointer-events-none"
      )}
      style={{
        "--coggle-accent": branchColor,
        borderLeftColor: side === "right" ? branchColor : undefined,
        borderRightColor: side === "left" ? branchColor : undefined,
        borderLeftWidth: side === "right" ? "3px" : "1px",
        borderRightWidth: side === "left" ? "3px" : "1px",
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          {/* Status Badge */}
          <span
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold border transition-colors",
              isCompleted && "border-success/80 bg-success text-success-foreground",
              isInProgress && "border-warning/80 bg-warning/25 text-warning",
              !isCompleted && !isInProgress && "border-border bg-muted/60 text-muted-foreground"
            )}
            title={`Status: ${status}`}
          >
            {isCompleted ? (
              <Check size={9} strokeWidth={3} />
            ) : isInProgress ? (
              <CircleDot size={9} className="animate-pulse" />
            ) : (
              recommendedOrder || <Circle size={8} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 text-xs font-bold leading-tight tracking-[-0.01em] text-foreground group-hover:text-primary transition-colors">
              {title}
            </h4>
            {subtitle && (
              <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Expand / Collapse Subtopics Button */}
        {hasChildren && (
          <button
            type="button"
            onClick={handleToggleCollapse}
            title={isCollapsed ? `Expand ${childCount} subtopics` : "Collapse subtopics"}
            aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[9px] font-bold transition-all",
              isCollapsed
                ? "border-primary/60 bg-primary/20 text-primary hover:bg-primary/30"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {isCollapsed ? `+${childCount}` : <Minus size={9} strokeWidth={2.5} />}
          </button>
        )}
      </div>

      {/* Resource counter strip */}
      {resources > 0 && (
        <div className="mt-1.5 flex items-center justify-between text-[9px] text-muted-foreground/80 pt-1 border-t border-border/40">
          <span className="truncate max-w-[120px]">{category}</span>
          <span className="font-semibold text-foreground/80">
            {resources} {resources === 1 ? "item" : "items"}
          </span>
        </div>
      )}

      {/* Handles */}
      {side === "right" ? (
        <>
          <Handle
            id="target-left"
            type="target"
            position={Position.Left}
            className="!w-2 !h-2 !border !border-background !bg-primary transition-transform group-hover:scale-125"
            style={{ background: branchColor }}
          />
          <Handle
            id="source-right"
            type="source"
            position={Position.Right}
            className="!w-2 !h-2 !border !border-background !bg-primary transition-transform group-hover:scale-125"
            style={{ background: branchColor }}
          />
        </>
      ) : (
        <>
          <Handle
            id="target-right"
            type="target"
            position={Position.Right}
            className="!w-2 !h-2 !border !border-background !bg-primary transition-transform group-hover:scale-125"
            style={{ background: branchColor }}
          />
          <Handle
            id="source-left"
            type="source"
            position={Position.Left}
            className="!w-2 !h-2 !border !border-background !bg-primary transition-transform group-hover:scale-125"
            style={{ background: branchColor }}
          />
        </>
      )}
    </div>
  );
}

export const CoggleNode = memo(CoggleNodeImpl);
