import { Check, CircleDot, CircleDashed } from "lucide-react";
import type { NodeStatus } from "@/types/roadmapGraph";
import { cn } from "@/lib/utils";

interface RoadmapLegendProps {
  className?: string;
}

const ITEMS: { status: NodeStatus; label: string; icon: React.ReactNode; cls: string }[] = [
  {
    status: "completed",
    label: "Completed",
    icon: <Check size={11} strokeWidth={3} />,
    cls: "border-success/30 bg-success/10 text-success",
  },
  {
    status: "in-progress",
    label: "In progress",
    icon: <CircleDot size={11} />,
    cls: "border-warning/30 bg-warning/10 text-warning",
  },
  {
    status: "not-started",
    label: "Not started",
    icon: <CircleDashed size={11} />,
    cls: "border-border bg-muted/40 text-muted-foreground",
  },
];

export function RoadmapLegend({ className }: RoadmapLegendProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[11px] font-medium",
        className
      )}
      role="list"
      aria-label="Node status legend"
    >
      {ITEMS.map((it) => (
        <span
          key={it.status}
          role="listitem"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5",
            it.cls
          )}
        >
          {it.icon}
          <span className="hidden sm:inline">{it.label}</span>
        </span>
      ))}
    </div>
  );
}
