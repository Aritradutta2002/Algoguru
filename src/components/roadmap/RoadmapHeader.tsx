"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  X,
  Maximize2,
  Minimize2,
  ChevronsUpDown,
  ChevronsDownUp,
  Crosshair,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pendingSelectionRef = useRef<RoadmapId | null>(null);

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
    if (pendingSelectionRef.current === id) return;

    pendingSelectionRef.current = id;
    queueMicrotask(() => {
      if (pendingSelectionRef.current === id) pendingSelectionRef.current = null;
    });

    if (onSelectRoadmap) {
      onSelectRoadmap(id);
    } else {
      router.push(`/roadmap/${id}`);
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <header
      className={cn(
        "relative z-30 flex flex-col gap-2.5 border-b border-border/60 bg-card/90 px-3 py-2.5 sm:px-5 backdrop-blur-xl shadow-[0_1px_3px_var(--coggle-raised)] transition-all",
        compact && "border-b-0 py-2"
      )}
    >
      {/* Top row: Brand & navigation + tabs + progress & actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back button + Roadmap switcher */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBackClick}
            className="group h-auto gap-1.5 rounded-full border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-foreground/85 shadow-sm hover:border-primary/40 hover:bg-muted hover:text-foreground transition-all active:scale-95 [&_svg]:size-[13px]"
            aria-label="Back to home"
          >
            <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          {/* Switcher tabs */}
          <Tabs
            value={activeId}
            onValueChange={(value) => handleTabClick(value as RoadmapId)}
          >
            <TabsList
              aria-label="Roadmap learning path tabs"
              className="h-auto inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 p-1"
            >
              {TABS.map((t) => {
                const active = t.id === activeId;
                return (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    aria-controls={undefined}
                    className={cn(
                      "rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold transition-all duration-200 whitespace-nowrap",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      active
                        ? "bg-card text-foreground font-bold shadow-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                        : "font-semibold text-foreground/75 hover:bg-card/70 hover:text-foreground"
                    )}
                    style={
                      active
                        ? {
                            boxShadow: `0 1px 3px rgb(0 0 0 / 0.08), inset 0 0 0 1.5px ${roadmap.accent}`,
                            color: roadmap.accent,
                          }
                        : undefined
                    }
                  >
                    {t.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
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
              <Badge
                variant="secondary"
                className="border-transparent text-[10px] px-1.5 py-0.2 rounded font-bold"
                style={{
                  background: `${roadmap.accent}20`,
                  color: roadmap.accent,
                }}
              >
                {stats.percent}%
              </Badge>
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
              <AppTooltip contentClassName="coggle-tip" content="Center on root topic (0)">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onCenterRoot}
                  className="h-8 w-8 rounded-full border-border/70 bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground [&_svg]:size-[14px]"
                  aria-label="Center view on root topic"
                >
                  <Crosshair size={14} />
                </Button>
              </AppTooltip>
            )}

            {onExpandAll && (
              <AppTooltip contentClassName="coggle-tip" content="Expand all branches">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onExpandAll}
                  className="h-8 w-8 rounded-full border-border/70 bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground [&_svg]:size-[14px]"
                  aria-label="Expand all branches"
                >
                  <ChevronsUpDown size={14} />
                </Button>
              </AppTooltip>
            )}

            {onCollapseAll && (
              <AppTooltip contentClassName="coggle-tip" content="Collapse all branches">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onCollapseAll}
                  className="h-8 w-8 rounded-full border-border/70 bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground [&_svg]:size-[14px]"
                  aria-label="Collapse all branches"
                >
                  <ChevronsDownUp size={14} />
                </Button>
              </AppTooltip>
            )}

            {onResetProgress && (
              <AppTooltip contentClassName="coggle-tip" content="Reset roadmap progress">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onResetProgress}
                  className="h-8 w-8 rounded-full border-border/70 bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground [&_svg]:size-[13px]"
                  aria-label="Reset roadmap progress"
                >
                  <RotateCcw size={13} />
                </Button>
              </AppTooltip>
            )}

            <AppTooltip contentClassName="coggle-tip" content={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8 rounded-full border-border/70 bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground [&_svg]:size-[13px]"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </Button>
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search topics, algorithms, or concepts... (Ctrl+F)"
            className="h-8 w-full rounded-full border-border/70 bg-card py-0 pl-8 pr-16 text-xs font-medium text-foreground placeholder:text-muted-foreground/80 shadow-sm focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/40 md:text-xs"
          />
          {searchQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onSearchChange?.("")}
              className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground [&_svg]:size-[13px]"
              aria-label="Clear search"
            >
              <X size={13} />
            </Button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
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
            <span className="hidden lg:inline text-[11px] font-semibold text-muted-foreground mr-1">
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
                <Button
                  key={f.id}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => onStatusFilterChange(f.id)}
                  aria-pressed={active}
                  className={cn(
                    "h-auto rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-all duration-150 border",
                    active
                      ? "bg-card text-primary font-bold border-primary/40 shadow-sm"
                      : "font-semibold text-foreground/75 bg-card/60 hover:bg-card hover:text-foreground border-border/60"
                  )}
                >
                  {f.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
