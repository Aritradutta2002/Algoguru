import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronsUpDown,
  ChevronsDownUp,
  Crosshair,
  RotateCcw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AppTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CompletionStats, Roadmap } from "@/types/roadmapGraph";
import type { RoadmapId } from "@/data/roadmaps";

interface RoadmapHeaderProps {
  roadmap: Roadmap;
  stats: CompletionStats;
  activeId: RoadmapId;
  compact?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter?: "all" | "in-progress" | "completed" | "not-started";
  onStatusFilterChange?: (status: "all" | "in-progress" | "completed" | "not-started") => void;
  matchedCount?: number;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onCenterRoot?: () => void;
  onResetProgress?: () => void;
  onBack?: () => void;
  onSelectRoadmap?: (id: RoadmapId) => void;
}

const TABS: { id: RoadmapId; label: string }[] = [
  { id: "dsa", label: "DSA" },
  { id: "java", label: "Core & Advanced Java" },
  { id: "system-design", label: "System Design" },
];

export function RoadmapHeader({
  roadmap,
  stats,
  activeId,
  compact = false,
  searchQuery = "",
  onSearchChange,
  statusFilter = "all",
  onStatusFilterChange,
  matchedCount = 0,
  onExpandAll,
  onCollapseAll,
  onCenterRoot,
  onResetProgress,
  onBack,
  onSelectRoadmap,
}: RoadmapHeaderProps) {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTabClick = (id: RoadmapId) => {
    if (onSelectRoadmap) {
      onSelectRoadmap(id);
    } else {
      navigate(`/roadmap/${id}`);
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <header
      className={cn(
        "relative z-30 flex flex-col gap-2.5 border-b border-border/70 bg-background/85 px-3 py-2.5 sm:px-5 backdrop-blur-xl shadow-sm transition-all",
        compact && "border-b-0 py-2"
      )}
    >
      {/* Top row: Brand & navigation + tabs + progress & actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back button + Roadmap switcher */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleBackClick}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card/80 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground transition-all active:scale-95"
            aria-label="Back to home"
          >
            <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Switcher tabs */}
          <div
            role="tablist"
            aria-label="Roadmap learning path tabs"
            className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-muted/40 p-1 shadow-inner"
          >
            {TABS.map((t) => {
              const active = t.id === activeId;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabClick(t.id)}
                  className={cn(
                    "rounded-lg px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold transition-all duration-200 whitespace-nowrap",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active
                      ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  )}
                  style={
                    active
                      ? {
                          borderLeft: `3px solid ${roadmap.accent}`,
                        }
                      : undefined
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right cluster: Progress bar + Expand/Collapse + Fullscreen */}
        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto flex-shrink-0">
          {/* Progress meter */}
          <div className="hidden md:flex flex-col items-end gap-1 min-w-[150px]">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <span>Progress:</span>
              <span className="text-foreground font-bold font-mono">
                {stats.completed}/{stats.total}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.2 rounded font-bold"
                style={{
                  background: `${roadmap.accent}20`,
                  color: roadmap.accent,
                }}
              >
                {stats.percent}%
              </span>
            </div>
            <Progress
              value={stats.percent}
              className="h-1.5 w-[150px] bg-muted/80"
              aria-label="Overall completion progress"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {onCenterRoot && (
              <AppTooltip content="Center on root topic (0)">
                <button
                  type="button"
                  onClick={onCenterRoot}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Center view on root topic"
                >
                  <Crosshair size={14} />
                </button>
              </AppTooltip>
            )}

            {onExpandAll && (
              <AppTooltip content="Expand all branches">
                <button
                  type="button"
                  onClick={onExpandAll}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Expand all branches"
                >
                  <ChevronsUpDown size={14} />
                </button>
              </AppTooltip>
            )}

            {onCollapseAll && (
              <AppTooltip content="Collapse all branches">
                <button
                  type="button"
                  onClick={onCollapseAll}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Collapse all branches"
                >
                  <ChevronsDownUp size={14} />
                </button>
              </AppTooltip>
            )}

            {onResetProgress && (
              <AppTooltip content="Reset roadmap progress">
                <button
                  type="button"
                  onClick={onResetProgress}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Reset roadmap progress"
                >
                  <RotateCcw size={13} />
                </button>
              </AppTooltip>
            )}

            <AppTooltip content={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </AppTooltip>
          </div>
        </div>
      </div>

      {/* Second row: Live Search & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search topics, algorithms, or concepts... (Ctrl+F)"
            className="h-8 w-full rounded-lg border border-border/70 bg-card/80 pl-8 pr-16 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
              /
            </kbd>
          )}

          {searchQuery && (
            <div className="absolute left-0 top-full mt-1 z-30 inline-flex items-center gap-1 rounded-md bg-card border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-md">
              <span className="text-primary font-bold">{matchedCount}</span>
              <span>{matchedCount === 1 ? "match found" : "matches found"}</span>
            </div>
          )}
        </div>

        {/* Status Filter Chips */}
        {onStatusFilterChange && (
          <div className="flex items-center gap-1">
            <span className="hidden lg:inline text-[11px] font-medium text-muted-foreground/80 mr-1">
              Filter:
            </span>
            {(
              [
                { id: "all", label: "All" },
                { id: "in-progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
              ] as const
            ).map((f) => {
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onStatusFilterChange(f.id)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-[10.5px] font-semibold transition-all duration-150",
                    active
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
