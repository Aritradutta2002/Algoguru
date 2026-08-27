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
        "relative z-30 flex flex-col gap-3 border-b border-border/40 bg-background/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 pt-4 pb-3"
      )}
    >
      {/* Top row: back / title / actions */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={() => navigate("/roadmap")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-card/60 px-3 py-1.5",
            "text-[11px] font-bold uppercase tracking-widest text-muted-foreground",
            "hover:text-foreground hover:bg-muted transition-all active:scale-95"
          )}
          aria-label="Back to all roadmaps"
        >
          <ArrowLeft size={12} />
          All Roadmaps
        </button>

        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] font-black uppercase tracking-[0.25em]"
            style={{ color: roadmap.accent }}
          >
            Roadmap
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-tight leading-none">
            {roadmap.title}
          </h1>
          <p className="hidden sm:block text-[11px] text-muted-foreground mt-0.5">
            {roadmap.subtitle}
          </p>
        </div>

        <div className="hidden md:flex flex-col items-end gap-1 min-w-[180px]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Overall progress</span>
            <span className="text-foreground">
              {stats.completed} / {stats.total} · {stats.percent}%
            </span>
          </div>
          <Progress
            value={stats.percent}
            className="h-1.5 w-[180px] bg-muted/60"
            aria-label="Overall roadmap progress"
          />
        </div>
      </div>

      {/* Bottom row: switcher + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Roadmap"
          className="inline-flex items-center gap-1 rounded-xl border border-border/40 bg-muted/40 p-1"
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
                  "rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-primary/40",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <RoadmapLegend className="hidden sm:flex" />
      </div>

      {/* Mobile progress bar (md-) */}
      <div className="md:hidden flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>Progress</span>
        <Progress value={stats.percent} className="h-1.5 flex-1 bg-muted/60" />
        <span className="text-foreground">{stats.percent}%</span>
      </div>
    </header>
  );
}
