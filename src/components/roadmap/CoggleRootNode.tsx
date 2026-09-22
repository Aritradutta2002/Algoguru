import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Sparkles, CheckCircle2, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoggleNodeData } from "@/types/roadmapGraph";

function CoggleRootNodeImpl({ data, selected }: NodeProps<{ data: CoggleNodeData }>) {
  const {
    title,
    subtitle,
    branchColor,
    totalTopics = 0,
    completedTopics = 0,
    matchedSearch,
    statusHidden,
    onSelect,
    id,
  } = data;

  const percent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(id);
        }
      }}
      aria-label={`${title} Root Hub — ${percent}% completed`}
      className={cn(
        "group relative flex min-h-[78px] w-[260px] cursor-pointer select-none flex-col justify-center rounded-2xl p-3.5 text-center transition-all duration-300",
        "border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl",
        "hover:scale-[1.03] hover:shadow-[0_0_35px_-8px_var(--coggle-root-glow)]",
        selected && "ring-2 ring-primary ring-offset-4 ring-offset-background",
        matchedSearch === false && "opacity-25 grayscale hover:opacity-80 transition-opacity",
        statusHidden && "opacity-20 pointer-events-none"
      )}
      style={{
        "--coggle-root-accent": branchColor,
        "--coggle-root-glow": `${branchColor}88`,
      } as React.CSSProperties}
    >
      {/* Ambient background glow behind the root */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 rounded-3xl opacity-40 blur-xl transition-opacity duration-300 group-hover:opacity-75"
        style={{
          background: `radial-gradient(circle, ${branchColor}44 0%, transparent 75%)`,
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute inset-x-4 top-0 h-[3px] rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${branchColor}, transparent)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
          <Sparkles size={11} style={{ color: branchColor }} />
          <span>Learning Path Hub</span>
        </div>

        <h2 className="text-base font-extrabold tracking-tight text-foreground line-clamp-1">
          {title}
        </h2>

        {subtitle && (
          <p className="line-clamp-1 text-[11px] font-medium text-muted-foreground">
            {subtitle}
          </p>
        )}

        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            <MapIcon size={11} />
            {totalTopics} topics
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold",
              percent > 0
                ? "bg-success/15 text-success border border-success/30"
                : "bg-muted/70 text-muted-foreground"
            )}
          >
            <CheckCircle2 size={11} />
            {percent}% done
          </span>
        </div>
      </div>

      {/* Handles: Left for Left wing, Right for Right wing */}
      <Handle
        id="root-left"
        type="source"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-background !bg-primary transition-transform group-hover:scale-125"
        style={{ background: branchColor }}
      />
      <Handle
        id="root-right"
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !border-background !bg-primary transition-transform group-hover:scale-125"
        style={{ background: branchColor }}
      />
    </div>
  );
}

export const CoggleRootNode = memo(CoggleRootNodeImpl);
