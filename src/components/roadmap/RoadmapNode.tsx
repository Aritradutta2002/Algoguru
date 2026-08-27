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
        "group relative flex min-h-[39px] w-[120px] items-center justify-center px-2 pb-2 pt-1.5 cursor-pointer select-none rounded-[5px] bg-[#50558b] text-slate-50 transition-all duration-200 shadow-[0_2px_0_rgba(0,0,0,0.25)]",
        "hover:bg-[#5c629b] hover:-translate-y-0.5",
        selected ? "ring-2 ring-primary/40" : "",
        isCompleted && "opacity-95"
      )}
      style={{
        border: `1px solid ${selected ? accentColor : "#61689f"}`,
      }}
    >
      <h3 className="max-w-full text-center text-[13px] font-bold leading-[15px] tracking-[-0.02em]">
        {data.title}
      </h3>

      {/* The pale rail is always visible; progress fills it in from the left. */}
      <div className="absolute bottom-[5px] left-[7px] h-[3px] w-[106px] overflow-hidden rounded-full bg-[#f4f4f6]">
        {(isCompleted || isInProgress) && (
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: isCompleted ? "100%" : "50%",
              background: "#21d4a0",
            }}
            aria-hidden="true"
          />
        )}
      </div>

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
