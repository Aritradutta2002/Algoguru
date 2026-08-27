import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { RoadmapLegend } from "./RoadmapLegend";
import { cn } from "@/lib/utils";
import type { CompletionStats, Roadmap } from "@/types/roadmapGraph";
import type { RoadmapId } from "@/data/roadmaps";

interface RoadmapHeaderProps {
  roadmap: Roadmap;
  stats: CompletionStats;
  /** Active switcher id. */
  activeId: RoadmapId;
  /** Hide the header entirely (chrome-free mode — the tab bar lives outside). */
  compact?: boolean;
}

const TABS: { id: RoadmapId; label: string }[] = [
  { id: "dsa", label: "DSA" },
  { id: "java", label: "Java" },
  { id: "system-design", label: "System Design" },
];

/**
 * Sticky top header for the roadmap view.
 *
 * - Back to hub
 * - Title + subtitle
 * - Segmented control switcher between the 3 roadmaps
 * - Overall progress + legend
 */
export function RoadmapHeader({ roadmap, stats, activeId, compact }: RoadmapHeaderProps) {
  const navigate = useNavigate();

  if (compact) return null;

  return (
    <header
      className={cn(
        "relative z-30 flex flex-col gap-3 border-b border-border bg-background/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 pt-4 pb-3"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={() => navigate("/roadmap")}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Back to all roadmaps"
        >
          <ArrowLeft size={12} />
          All roadmaps
        </button>

        <div className="min-w-0 flex-1">
          <div
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: roadmap.accent }}
          >
            Roadmap
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight leading-none">
            {roadmap.title}
          </h1>
          <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">
            {roadmap.subtitle}
          </p>
        </div>

        <div className="hidden md:flex flex-col items-end gap-1 min-w-[180px]">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <span>Overall progress</span>
            <span className="text-foreground">
              {stats.completed} / {stats.total} · {stats.percent}%
            </span>
          </div>
          <Progress
            value={stats.percent}
            className="h-1.5 w-[180px] bg-muted"
            aria-label="Overall roadmap progress"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Roadmap"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
        >
          {TABS.map((t) => {
            const active = t.id === activeId;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => navigate(`/roadmap/${t.id}`)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary/40",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <RoadmapLegend className="hidden sm:flex" />
      </div>

      <div className="md:hidden flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <span>Progress</span>
        <Progress value={stats.percent} className="h-1.5 flex-1 bg-muted" />
        <span className="text-foreground">{stats.percent}%</span>
      </div>
    </header>
  );
}
