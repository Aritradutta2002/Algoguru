import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { CoggleNodeData } from "@/types/roadmapGraph";

function CoggleRootNodeImpl({ data, selected }: NodeProps<{ data: CoggleNodeData }>) {
  const {
    title,
    pillWidth,
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
        "group relative flex min-h-[124px] cursor-pointer select-none flex-col items-center justify-center gap-1 rounded-xl px-7 py-4 text-center transition-[box-shadow,opacity] duration-300",
        matchedSearch === false && "opacity-25 grayscale hover:opacity-80 transition-opacity",
        statusHidden && "opacity-20 pointer-events-none"
      )}
      style={
        {
          width: pillWidth && pillWidth > 0 ? pillWidth : 400,
          background: "var(--coggle-root, #f4f6f2)",
          color: "#101828",
          border: "1.5px solid rgb(255 255 255 / 0.14)",
          boxShadow: selected
            ? "0 0 0 2px var(--coggle-paper, #131513), 0 0 0 4px #f4f6f2, 0 14px 34px -12px rgb(0 0 0 / 0.6)"
            : "0 10px 28px -10px rgb(0 0 0 / 0.55), 0 2px 6px -2px rgb(0 0 0 / 0.4)",
        } as React.CSSProperties
      }
    >
      {/* Hover sheen (overlay, not a filter — filters blur scaled text) */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl bg-black transition-opacity duration-200",
          selected ? "opacity-[0.04]" : "opacity-0 group-hover:opacity-[0.05]"
        )}
      />
      <div className="relative z-10 flex flex-col items-center">
        <h2 className="text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] line-clamp-2">
          {title}
        </h2>
        <p className="mt-1 text-[15px] font-semibold leading-none text-slate-600">
          {totalTopics} topics · {percent}% done
        </p>
      </div>

      {/* Four structural handles — one per radial wing */}
      <Handle
        id="root-left"
        type="source"
        position={Position.Left}
        className="!w-3 !h-3"
        style={{ background: "#f4f6f2" }}
      />
      <Handle
        id="root-right"
        type="source"
        position={Position.Right}
        className="!w-3 !h-3"
        style={{ background: "#f4f6f2" }}
      />
      <Handle
        id="root-top"
        type="source"
        position={Position.Top}
        className="!w-3 !h-3"
        style={{ background: "#f4f6f2" }}
      />
      <Handle
        id="root-bottom"
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3"
        style={{ background: "#f4f6f2" }}
      />
    </div>
  );
}

export const CoggleRootNode = memo(CoggleRootNodeImpl);
