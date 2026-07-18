import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { AppTooltip } from "./ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Activity, BarChart3 } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type HeatmapMode = "website" | "leetcode" | "codechef";

interface ActivityHeatmapProps {
  websiteCalendar?: Record<string, number>;
  leetcodeCalendar?: Record<string, number>;
  leetcodeActiveYears?: number[];
  codechefCalendar?: Record<string, number>;
  dataMode: HeatmapMode;
  onModeChange: (mode: HeatmapMode) => void;
  isLoading?: boolean;
}

type YearOption = "Last 12 months" | number;

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const CELL_SIZE = 14;
const CELL_GAP = 3;
const DAY_LABEL_WIDTH = 32;

const dateKeyFromDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const dateKeyFromUtcTimestamp = (timestampSeconds: number) => {
  const date = new Date(timestampSeconds * 1000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

const normalizeCalendarDateKey = (dateKey: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return dateKey;
  }

  const timestamp = Number(dateKey);
  if (Number.isFinite(timestamp)) {
    return dateKeyFromUtcTimestamp(timestamp);
  }

  const parsedDate = new Date(dateKey);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return dateKeyFromDate(parsedDate);
};

const MODE_INTENSITY_COLORS: Record<HeatmapMode, string[]> = {
  website: [
    "bg-muted/80 dark:bg-[#202020]",
    "bg-emerald-200 dark:bg-emerald-950/80",
    "bg-emerald-300 dark:bg-emerald-800/85",
    "bg-emerald-400 dark:bg-emerald-600/85",
    "bg-emerald-500 dark:bg-emerald-500/90",
    "bg-emerald-600 dark:bg-emerald-400",
  ],
  leetcode: [
    "bg-muted/80 dark:bg-[#202020]",
    "bg-amber-200 dark:bg-[#3a2812]/80",
    "bg-amber-300 dark:bg-[#70470f]/85",
    "bg-amber-400 dark:bg-[#b36a08]/90",
    "bg-amber-500 dark:bg-[#f59e0b]/90",
    "bg-amber-600 dark:bg-[#fbbf24]",
  ],
  codechef: [
    "bg-muted/80 dark:bg-[#202020]",
    "bg-orange-200 dark:bg-[#2f241e]/80",
    "bg-orange-300 dark:bg-[#604533]/85",
    "bg-orange-400 dark:bg-[#98623b]/90",
    "bg-orange-500 dark:bg-[#d08a47]/90",
    "bg-orange-600 dark:bg-[#f5b15e]",
  ],
};

const MODE_RING_COLORS: Record<HeatmapMode, string[]> = {
  website: [
    "ring-border/50 dark:ring-white/10",
    "ring-emerald-200/50 dark:ring-emerald-500/30",
    "ring-emerald-300/50 dark:ring-emerald-400/30",
    "ring-emerald-400/50 dark:ring-emerald-400/40",
    "ring-emerald-500/50 dark:ring-emerald-300/40",
    "ring-emerald-600/50 dark:ring-emerald-300/50",
  ],
  leetcode: [
    "ring-border/50 dark:ring-white/10",
    "ring-amber-200/50 dark:ring-amber-500/30",
    "ring-amber-300/50 dark:ring-amber-400/30",
    "ring-amber-400/50 dark:ring-amber-400/40",
    "ring-amber-500/50 dark:ring-amber-300/40",
    "ring-amber-600/50 dark:ring-amber-300/50",
  ],
  codechef: [
    "ring-border/50 dark:ring-white/10",
    "ring-orange-200/50 dark:ring-orange-500/25",
    "ring-orange-300/50 dark:ring-orange-400/30",
    "ring-orange-400/50 dark:ring-orange-400/40",
    "ring-orange-500/50 dark:ring-orange-300/40",
    "ring-orange-600/50 dark:ring-orange-300/50",
  ],
};

export function ActivityHeatmap({
  websiteCalendar = {},
  leetcodeCalendar = {},
  leetcodeActiveYears = [],
  codechefCalendar = {},
  dataMode,
  onModeChange,
  isLoading = false,
}: ActivityHeatmapProps) {
  const [selectedYear, setSelectedYear] =
    useState<YearOption>("Last 12 months");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animReady, setAnimReady] = useState(false);

  // Responsive cell sizing
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(max-width: 1023px)");

  const cellSize = isMobile ? 10 : isTablet ? 12 : CELL_SIZE;
  const cellGap = isMobile ? 2 : CELL_GAP;

  useEffect(() => {
    setAnimReady(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentYear = new Date().getFullYear();
  const yearOptions: YearOption[] = useMemo(() => {
    const years =
      dataMode === "leetcode" && leetcodeActiveYears.length > 0
        ? leetcodeActiveYears
        : [currentYear, currentYear - 1, currentYear - 2];

    return [
      "Last 12 months",
      ...Array.from(
        new Set(
          years
            .map((year) => Number(year))
            .filter((year) => Number.isInteger(year) && year <= currentYear),
        ),
      ).sort((a, b) => b - a),
    ];
  }, [currentYear, dataMode, leetcodeActiveYears]);

  const modeConfig = useMemo(
    () => ({
      website: {
        label: "Website",
        color: "text-emerald-400",
        dot: "bg-emerald-400/70",
        activeBg: "bg-emerald-500/15 border-emerald-500/20",
      },
      leetcode: {
        label: "LeetCode",
        color: "text-[#FFA116]",
        dot: "bg-[#FFA116]/75",
        activeBg: "bg-[#FFA116]/15 border-[#FFA116]/20",
      },
      codechef: {
        label: "CodeChef",
        color: "text-[#f5b15e]",
        dot: "bg-[#f5b15e]/75",
        activeBg: "bg-[#8B5E34]/20 border-[#f5b15e]/20",
      },
    }),
    [],
  );

  const activeModeColor = modeConfig[dataMode]?.color || "text-emerald-400";
  const activeDotColor = modeConfig[dataMode]?.dot || "bg-emerald-400/70";
  const intensityColors =
    MODE_INTENSITY_COLORS[dataMode] || MODE_INTENSITY_COLORS.website;
  const intensityRingColors =
    MODE_RING_COLORS[dataMode] || MODE_RING_COLORS.website;

  const {
    weeks,
    activeDays,
    maxStreak,
    totalSubmissions,
    monthLabels,
    maxCount,
  } = useMemo(() => {
    let startDate: Date;
    let daysInGrid = 365;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedYear === "Last 12 months") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 364);
    } else {
      startDate = new Date(selectedYear, 0, 1);
      const isLeapYear =
        (selectedYear % 4 === 0 && selectedYear % 100 !== 0) ||
        selectedYear % 400 === 0;
      daysInGrid = isLeapYear ? 366 : 365;
    }

    const activityMap: Record<string, number> = {};
    let totalSubs = 0;

    if (dataMode === "leetcode") {
      Object.entries(leetcodeCalendar).forEach(([timestamp, count]) => {
        const key = normalizeCalendarDateKey(timestamp);
        const entryCount = Number(count);
        if (key && Number.isFinite(entryCount)) {
          activityMap[key] = (activityMap[key] || 0) + entryCount;
          totalSubs += entryCount;
        }
      });
    } else {
      const sourceCalendar =
        dataMode === "website" ? websiteCalendar : codechefCalendar;
      Object.entries(sourceCalendar).forEach(([dateStr, count]) => {
        const key = normalizeCalendarDateKey(dateStr);
        const entryCount = Number(count);
        if (key && Number.isFinite(entryCount)) {
          activityMap[key] = (activityMap[key] || 0) + entryCount;
          totalSubs += entryCount;
        }
      });
    }

    const days: Array<{
      date: Date;
      dateString: string;
      count: number;
      month: string;
      isFirstOfMonth: boolean;
    }> = [];
    let currentStreak = 0;
    let maxStr = 0;
    let actDays = 0;
    let rangeSubs = 0;
    let maxCnt = 0;

    for (let i = 0; i < daysInGrid; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);

      const isFuture = current > today;
      const key = dateKeyFromDate(current);
      const count = activityMap[key] || 0;

      if (count > maxCnt) maxCnt = count;

      if (count > 0 && !isFuture) {
        currentStreak++;
        actDays++;
        rangeSubs += count;
        if (currentStreak > maxStr) maxStr = currentStreak;
      } else if (!isFuture) {
        currentStreak = 0;
      }

      days.push({
        date: current,
        dateString: key,
        count: count,
        month: current.toLocaleString("default", { month: "short" }),
        isFirstOfMonth: current.getDate() === 1,
      });
    }

    // Organize into columns (weeks)
    const columns: Array<Array<(typeof days)[0] | null>> = [];
    let currentWeek: Array<(typeof days)[0] | null> = [];
    const mLabels: { label: string; colIndex: number }[] = [];

    const firstDayOfWeek = days[0].date.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    days.forEach((day, idx) => {
      if (day.isFirstOfMonth) {
        mLabels.push({ label: day.month, colIndex: columns.length });
      }

      currentWeek.push(day);
      if (currentWeek.length === 7 || idx === days.length - 1) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        columns.push(currentWeek);
        currentWeek = [];
      }
    });

    return {
      weeks: columns,
      activeDays: actDays,
      maxStreak: maxStr,
      totalSubmissions: rangeSubs,
      monthLabels: mLabels,
      maxCount: maxCnt,
    };
  }, [
    websiteCalendar,
    leetcodeCalendar,
    codechefCalendar,
    dataMode,
    selectedYear,
  ]);

  // Calculate intensity level (0-5) from count
  const getIntensityLevel = useCallback(
    (count: number): number => {
      if (count === 0) return 0;
      if (maxCount === 0) return 1;
      // For sparse data (maxCount <= 3), use linear scale
      if (maxCount <= 3) return Math.min(count, 5);
      const ratio = count / maxCount;
      if (ratio <= 0.1) return 1;
      if (ratio <= 0.25) return 2;
      if (ratio <= 0.45) return 3;
      if (ratio <= 0.7) return 4;
      return 5;
    },
    [maxCount],
  );

  const hasActivity = totalSubmissions > 0;

  // Build the grid key to re-trigger animations on data change
  const gridKey = `${dataMode}-${selectedYear}-${totalSubmissions}`;

  // Filter month labels: only show labels with enough spacing
  const visibleMonthLabels = useMemo(() => {
    return monthLabels.filter((ml, i) => {
      const left = ml.colIndex * (cellSize + cellGap) + cellSize / 2;
      const nextLabel = monthLabels[i + 1];
      const nextLeft = nextLabel
        ? nextLabel.colIndex * (cellSize + cellGap) + cellSize / 2
        : Infinity;
      return nextLeft - left > cellSize * 2 || i === monthLabels.length - 1;
    });
  }, [monthLabels, cellSize, cellGap]);

  return (
    <div className="w-full flex flex-col font-sans select-none">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-muted/60 border border-border/50 dark:bg-white/[0.04] dark:border-white/[0.06]">
            <Activity size={16} className={cn(activeModeColor, "opacity-80")} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              Contribution Activity
            </h3>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
              {totalSubmissions.toLocaleString()}{" "}
              {totalSubmissions === 1 ? "submission" : "submissions"} in{" "}
              {selectedYear === "Last 12 months"
                ? "the last 12 months"
                : selectedYear}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Year Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex w-full sm:w-auto items-center justify-center gap-2 text-[11px] font-semibold text-muted-foreground bg-muted/60 border border-border/50 px-3 py-2 rounded-xl hover:bg-muted hover:text-foreground transition-all duration-200 active:scale-95 dark:text-white/60 dark:bg-white/[0.04] dark:border-white/[0.08] dark:hover:bg-white/[0.08] dark:hover:text-white/80"
            >
              {selectedYear === "Last 12 months" ? "12 months" : selectedYear}
              <ChevronDown
                size={12}
                className={cn(
                  "transition-transform duration-200 cursor-pointer",
                  isDropdownOpen && "rotate-180",
                )}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-popover text-popover-foreground border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 dark:bg-[#1a1a1a] dark:border-white/[0.08]">
                <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/60 dark:text-white/30 dark:border-white/[0.06]">
                  Select Range
                </div>
                {yearOptions.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-[12px] font-semibold transition-all duration-150 hover:bg-muted active:scale-[0.98] dark:hover:bg-white/[0.06]",
                      selectedYear === year
                        ? "text-foreground bg-muted/70 dark:text-white dark:bg-white/[0.04]"
                        : "text-muted-foreground hover:text-foreground dark:text-white/50 dark:hover:text-white/80",
                    )}
                  >
                    {year === "Last 12 months" ? "Last 12 months" : year}
                    {year === currentYear && (
                      <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-emerald-400/60">
                        Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="grid grid-cols-3 bg-muted/60 rounded-2xl p-0.5 border border-border/50 shadow-inner dark:bg-white/[0.03] dark:border-white/[0.06]">
            {(Object.keys(modeConfig) as HeatmapMode[]).map((mode) => {
              const cfg = modeConfig[mode];
              const isActive = dataMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    "min-w-0 text-[10px] font-bold px-2.5 sm:px-3.5 py-2 rounded-xl transition-all duration-300 tracking-wider uppercase",
                    isActive
                      ? `${cfg.activeBg} ${cfg.color} shadow-sm`
                      : "text-muted-foreground hover:text-foreground dark:text-white/35 dark:hover:text-white/70",
                  )}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Heatmap Grid ── */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden rounded-2xl border border-border/50 bg-muted/25 p-4 shadow-inner scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent dark:border-white/[0.06] dark:bg-[#141414] dark:scrollbar-thumb-white/[0.08]"
        style={{ minHeight: `${cellSize * 7 + cellGap * 8 + 56}px` }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/75 backdrop-blur-[2px] rounded-2xl dark:bg-[#0d0d0d]/70">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                <Loader2
                  className="animate-spin text-emerald-400/60 relative"
                  size={24}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Loading activity...
              </span>
            </div>
          </div>
        )}

        <div
          key={gridKey}
          className={cn(
            "relative inline-flex flex-col transition-opacity duration-300",
            isLoading && "opacity-20 pointer-events-none",
          )}
        >
          {/* ── Month Labels ── */}
          {visibleMonthLabels.length > 0 && (
            <div
              className="relative h-5 mb-1.5"
              style={{ marginLeft: `${DAY_LABEL_WIDTH}px` }}
            >
              <div className="absolute inset-0">
                {visibleMonthLabels.map((ml, i) => {
                  const left =
                    ml.colIndex * (cellSize + cellGap) + cellSize / 2;
                  return (
                    <div
                      key={i}
                      className="absolute text-[10px] font-semibold text-muted-foreground tracking-wide"
                      style={{
                        left: `${left}px`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      {ml.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Grid + Day Labels ── */}
          <div className="flex">
            {/* Day Labels (left side) */}
            <div
              className="flex flex-col shrink-0 pt-[1px]"
              style={{ gap: `${cellGap}px`, width: `${DAY_LABEL_WIDTH}px` }}
            >
              {DAY_LABELS.map((label, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-end pr-2 text-[10px] font-medium text-muted-foreground/70"
                  style={{ height: `${cellSize}px` }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Cells Grid or Empty State */}
            {!hasActivity ? (
              <div
                className="flex items-center justify-center"
                style={{
                  height: `${cellSize * 7 + cellGap * 6}px`,
                  paddingLeft: `${cellSize}px`,
                  paddingRight: `${cellSize}px`,
                }}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <BarChart3 size={20} className="text-muted-foreground/40" />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    No activity recorded in this period
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex" style={{ gap: `${cellGap}px` }}>
                {weeks.map((week, wIdx) => (
                  <div
                    key={wIdx}
                    className="flex flex-col"
                    style={{ gap: `${cellGap}px` }}
                  >
                    {week.map((day, dIdx) => {
                      if (!day) {
                        return (
                          <div
                            key={dIdx}
                            style={{
                              width: `${cellSize}px`,
                              height: `${cellSize}px`,
                            }}
                          />
                        );
                      }

                      const isFuture = day.date > new Date();
                      const count = day.count;
                      const level = getIntensityLevel(count);
                      const colorClass = intensityColors[level];
                      const ringClass = intensityRingColors[level];

                      return (
                        <AppTooltip
                          key={dIdx}
                          side="top"
                          content={
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "text-[11px] font-bold",
                                    count > 0
                                      ? activeModeColor
                                      : "text-white/40",
                                  )}
                                >
                                  {count}{" "}
                                  {count === 1 ? "submission" : "submissions"}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-white/50">
                                {day.date.toLocaleDateString(undefined, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              {count > 0 && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/70">
                                    Active
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-emerald-400/50" />
                                </div>
                              )}
                            </div>
                          }
                        >
                          <div
                            className={cn(
                              "rounded-[3px] transition-all duration-150",
                              colorClass,
                              !isFuture && count > 0 && "ring-0 hover:ring-2",
                              ringClass,
                              isFuture && "opacity-15",
                              !isFuture &&
                                count > 0 &&
                                "cursor-pointer hover:scale-[1.35] hover:shadow-lg",
                              !isFuture &&
                                count > 0 &&
                                dataMode === "website" &&
                                "hover:shadow-emerald-500/20",
                              !isFuture &&
                                count > 0 &&
                                dataMode === "leetcode" &&
                                "hover:shadow-amber-500/20",
                              !isFuture &&
                                count > 0 &&
                                dataMode === "codechef" &&
                                "hover:shadow-orange-500/20",
                              !isFuture &&
                                count === 0 &&
                                "hover:ring-1 hover:ring-white/[0.12]",
                              animReady && "animate-in fade-in",
                            )}
                            style={{
                              width: `${cellSize}px`,
                              height: `${cellSize}px`,
                              animationDelay: `${Math.min(wIdx * 4, 200)}ms`,
                              animationDuration: "400ms",
                            }}
                          />
                        </AppTooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer / Stats + Legend ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-5 pt-4 border-t border-border/50 dark:border-white/[0.06]">
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", activeDotColor)} />
              <span className="text-[11px] font-semibold text-foreground dark:text-white/90">
                {activeDays}
              </span>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              active days
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#FFA116]/90">
                {maxStreak}
              </span>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              longest streak
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-foreground dark:text-white/90">
                {totalSubmissions.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5 text-[10px] font-medium text-muted-foreground">
          <span>Less</span>
          <div className="flex items-center gap-[2px]">
            {intensityColors.map((colorClass, idx) => (
              <div
                key={idx}
                className={cn("rounded-[2px]", colorClass)}
                style={{
                  width: `${isMobile ? 8 : 10}px`,
                  height: `${isMobile ? 8 : 10}px`,
                }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
