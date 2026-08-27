import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { NodeStatus, RoadmapNodeData } from "@/types/roadmapGraph";

/**
 * Resolve the category → accent color for a node. Falls back to a neutral
 * purple if the data file didn't include the category in the categories array.
 */
function resolveAccent(
  data: RoadmapNodeData,
  categoryColors: Record<string, string>
): string {
  if (data.accent) return data.accent;
  return categoryColors[data.category] ?? "#A855F7";
}

/** Engine-augmented node data: status + accent + click handler, on top of the user's data. */
export type RoadmapNodeDataWithStatus = RoadmapNodeData & {
  status: NodeStatus;
  accentColor: string;
  onClick: (id: string) => void;
};

/** The full node shape that React Flow expects, with our data type. */
export type RoadmapFlowNode = Node<RoadmapNodeDataWithStatus, "roadmap">;

interface RoadmapNodeProps extends NodeProps<RoadmapFlowNode> {}

/**
 * Custom React Flow node that renders a NeetCode-style card.
 */
function RoadmapNodeImpl({ data, id, selected }: RoadmapNodeProps) {
  const { status, accentColor, onClick } = data;
  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(id);
        }
      }}
      aria-label={`${data.title} — ${status}. Click for details.`}
      className={cn(
        "group relative flex items-center justify-center min-w-[120px] px-5 py-2.5 cursor-pointer select-none rounded-[6px] bg-[#3a3f58] text-slate-50 transition-all duration-200 shadow-sm",
        "hover:shadow-md hover:-translate-y-0.5",
        selected ? "ring-2 ring-primary/40" : "",
        isCompleted && "opacity-95"
      )}
      style={{
        border: `1px solid ${selected ? accentColor : accentColor + "59"}`,
      }}
    >
      <h3 className="text-[14px] font-bold tracking-wide text-center whitespace-nowrap">
        {data.title}
      </h3>

      {/* Bottom progress strip */}
      {(isCompleted || isInProgress) && (
        <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-[6px]">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: isCompleted ? "100%" : "50%",
              background: isCompleted ? "hsl(var(--success))" : accentColor,
            }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Connection handles — invisible but present for React Flow. */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
      />
    </div>
  );
}

export const RoadmapNode = memo(RoadmapNodeImpl);
export { resolveAccent };
export type { RoadmapNodeProps };
