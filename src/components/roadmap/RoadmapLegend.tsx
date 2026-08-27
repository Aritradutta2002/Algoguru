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
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  },
  {
    status: "in-progress",
    label: "In progress",
    icon: <CircleDot size={11} />,
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
  {
    status: "not-started",
    label: "Not started",
    icon: <CircleDashed size={11} />,
    cls: "border-border/40 bg-muted/40 text-muted-foreground",
  },
];

/**
 * Compact legend showing the three node statuses.
 * Used inside `RoadmapHeader` so users always know what the colours mean.
 */
export function RoadmapLegend({ className }: RoadmapLegendProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest",
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
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
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
