import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { AppTooltip } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronDown, Loader2, Activity, BarChart3 } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type HeatmapMode = "website" | "leetcode" | "codechef";

interface ActivityHeatmapProps {
  websiteCalendar?: Record<string, number>;
  leetcodeCalendar?: Record<string, number>;
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

// 6-level intensity scale (0 = no activity, 5 = maximum) — borderless like GitHub
const INTENSITY_COLORS = [
  "bg-[#1a1a1a]",           // Level 0: no activity
  "bg-emerald-950/70",       // Level 1: barely noticeable
  "bg-emerald-800/80",       // Level 2: subtle
  "bg-emerald-600/80",       // Level 3: medium
  "bg-emerald-500/85",       // Level 4: strong
  "bg-emerald-400",          // Level 5: max intensity
];

const INTENSITY_RING_COLORS = [
  "ring-white/10",
  "ring-emerald-500/30",
  "ring-emerald-400/30",
  "ring-emerald-400/40",
  "ring-emerald-300/40",
  "ring-emerald-300/50",
];

export function ActivityHeatmap({
  websiteCalendar = {},
  leetcodeCalendar = {},
  codechefCalendar = {},
  dataMode,
  onModeChange,
  isLoading = false
}: ActivityHeatmapProps) {

  const [selectedYear, setSelectedYear] = useState<YearOption>("Last 12 months");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animReady, setAnimReady] = useState(false);

  // Responsive cell sizing
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(max-width: 1023px)');

  const cellSize = isMobile ? 10 : isTablet ? 12 : CELL_SIZE;
  const cellGap = isMobile ? 2 : CELL_GAP;

  useEffect(() => {
    setAnimReady(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentYear = new Date().getFullYear();
  const yearOptions: YearOption[] = ["Last 12 months", currentYear, currentYear - 1, currentYear - 2];

  const modeConfig = useMemo(() => ({
    website: { label: "Website", color: "text-emerald-400", activeBg: "bg-emerald-500/15 border-emerald-500/20" },
    leetcode: { label: "LeetCode", color: "text-[#FFA116]", activeBg: "bg-[#FFA116]/15 border-[#FFA116]/20" },
    codechef: { label: "CodeChef", color: "text-[#8B5CF6]", activeBg: "bg-[#8B5CF6]/15 border-[#8B5CF6]/20" },
  }), []);

  const activeModeColor = modeConfig[dataMode]?.color || "text-emerald-400";

  const { weeks, activeDays, maxStreak, totalSubmissions, monthLabels, maxCount } = useMemo(() => {
    let startDate: Date;
    let daysInGrid = 365;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedYear === "Last 12 months") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 364);
    } else {
      startDate = new Date(selectedYear, 0, 1);
      const isLeapYear = (selectedYear % 4 === 0 && selectedYear % 100 !== 0) || (selectedYear % 400 === 0);
      daysInGrid = isLeapYear ? 366 : 365;
    }

    const activityMap: Record<string, number> = {};
    let totalSubs = 0;

    if (dataMode === "leetcode") {
      Object.entries(leetcodeCalendar).forEach(([timestamp, count]) => {
        const d = new Date(parseInt(timestamp) * 1000);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        activityMap[key] = (activityMap[key] || 0) + count;
        totalSubs += count;
      });
    } else {
      const sourceCalendar = dataMode === "website" ? websiteCalendar : codechefCalendar;
      Object.entries(sourceCalendar).forEach(([dateStr, count]) => {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          activityMap[key] = (activityMap[key] || 0) + count;
          totalSubs += count;
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
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
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
        month: current.toLocaleString('default', { month: 'short' }),
        isFirstOfMonth: current.getDate() === 1
      });
    }

    // Organize into columns (weeks)
    const columns: Array<Array<typeof days[0] | null>> = [];
    let currentWeek: Array<typeof days[0] | null> = [];
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
  }, [websiteCalendar, leetcodeCalendar, codechefCalendar, dataMode, selectedYear]);

  // Calculate intensity level (0-5) from count
  const getIntensityLevel = useCallback((count: number): number => {
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
  }, [maxCount]);

  const hasActivity = totalSubmissions > 0;

  // Build the grid key to re-trigger animations on data change
  const gridKey = `${dataMode}-${selectedYear}-${totalSubmissions}`;

  // Filter month labels: only show labels with enough spacing
  const visibleMonthLabels = useMemo(() => {
    return monthLabels.filter((ml, i) => {
      const left = ml.colIndex * (cellSize + cellGap) + cellSize / 2;
      const nextLabel = monthLabels[i + 1];
      const nextLeft = nextLabel ? nextLabel.colIndex * (cellSize + cellGap) + cellSize / 2 : Infinity;
      return (nextLeft - left) > cellSize * 2 || i === monthLabels.length - 1;
    });
  }, [monthLabels, cellSize, cellGap]);

  return (
    <div className="w-full flex flex-col font-sans select-none">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <Activity size={16} className="text-white/60" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/90 tracking-tight">
              Contribution Activity
            </h3>
            <p className="text-[11px] font-medium text-white/40 mt-0.5">
              {totalSubmissions.toLocaleString()} {totalSubmissions === 1 ? 'submission' : 'submissions'} in {selectedYear === "Last 12 months" ? "the last 12 months" : selectedYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Year Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-[11px] font-semibold text-white/60 bg-white/[0.04] border border-white/[0.08] px-3 py-2 rounded-xl hover:bg-white/[0.08] hover:text-white/80 transition-all duration-200 active:scale-95"
            >
              {selectedYear === "Last 12 months" ? "12 months" : selectedYear}
              <ChevronDown size={12} className={cn("transition-transform duration-200 cursor-pointer", isDropdownOpen && "rotate-180")} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/30 border-b border-white/[0.06]">
                  Select Range
                </div>
                {yearOptions.map(year => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-[12px] font-semibold transition-all duration-150 hover:bg-white/[0.06] active:scale-[0.98]",
                      selectedYear === year
                        ? "text-white bg-white/[0.04]"
                        : "text-white/50 hover:text-white/80"
                    )}
                  >
                    {year === "Last 12 months" ? "Last 12 months" : year}
                    {year === currentYear && (
                      <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-emerald-400/60">Current</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-white/[0.03] rounded-2xl p-0.5 border border-white/[0.06] shadow-inner">
            {(Object.keys(modeConfig) as HeatmapMode[]).map((mode) => {
              const cfg = modeConfig[mode];
              const isActive = dataMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    "text-[10px] font-bold px-3.5 py-2 rounded-xl transition-all duration-300 tracking-wider uppercase",
                    isActive
                      ? `${cfg.activeBg} ${cfg.color} shadow-sm`
                      : "text-white/35 hover:text-white/70"
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
        className="relative overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-white/[0.06] scrollbar-track-transparent pb-2"
        style={{ minHeight: `${cellSize * 7 + cellGap * 8 + 16}px` }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0d0d]/60 backdrop-blur-[2px] rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="animate-spin text-emerald-400/60 relative" size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Loading activity...</span>
            </div>
          </div>
        )}

        <div key={gridKey} className={cn("relative inline-flex flex-col transition-opacity duration-300", isLoading && "opacity-20 pointer-events-none")}>
          {/* ── Month Labels ── */}
          {visibleMonthLabels.length > 0 && (
            <div
              className="relative h-5 mb-1.5"
              style={{ marginLeft: `${DAY_LABEL_WIDTH}px` }}
            >
              <div className="absolute inset-0">
                {visibleMonthLabels.map((ml, i) => {
                  const left = ml.colIndex * (cellSize + cellGap) + cellSize / 2;
                  return (
                    <div
                      key={i}
                      className="absolute text-[10px] font-semibold text-white/50 tracking-wide"
                      style={{ left: `${left}px`, transform: 'translateX(-50%)' }}
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
                  className="flex items-center justify-end pr-2 text-[10px] font-medium text-white/30"
                  style={{ height: `${cellSize}px` }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Cells Grid or Empty State */}
            {!hasActivity ? (
              <div className="flex items-center justify-center" style={{ height: `${cellSize * 7 + cellGap * 6}px`, paddingLeft: `${cellSize}px`, paddingRight: `${cellSize}px` }}>
                <div className="flex flex-col items-center gap-2 text-center">
                  <BarChart3 size={20} className="text-white/[0.08]" />
                  <span className="text-[11px] font-medium text-white/[0.15]">
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
                            style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                          />
                        );
                      }

                      const isFuture = day.date > new Date();
                      const count = day.count;
                      const level = getIntensityLevel(count);
                      const colorClass = INTENSITY_COLORS[level];
                      const ringClass = INTENSITY_RING_COLORS[level];

                      return (
                        <AppTooltip
                          key={dIdx}
                          side="top"
                          content={
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[11px] font-bold",
                                  count > 0 ? activeModeColor : "text-white/40"
                                )}>
                                  {count} {count === 1 ? 'submission' : 'submissions'}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-white/50">
                                {day.date.toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              {count > 0 && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/70">Active</span>
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
                              !isFuture && count > 0 && "cursor-pointer hover:scale-[1.35] hover:shadow-lg hover:shadow-emerald-500/20",
                              !isFuture && count === 0 && "hover:ring-1 hover:ring-white/[0.12]",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 pt-4 border-t border-white/[0.06]">
        {/* Stats */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400/70" />
              <span className="text-[11px] font-semibold text-white/90">{activeDays}</span>
            </div>
            <span className="text-[10px] font-medium text-white/40">active days</span>
          </div>
          <div className="w-px h-4 bg-white/[0.06]" />
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#FFA116]/90">{maxStreak}</span>
            </div>
            <span className="text-[10px] font-medium text-white/40">longest streak</span>
          </div>
          <div className="w-px h-4 bg-white/[0.06]" />
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-white/90">{totalSubmissions.toLocaleString()}</span>
            </div>
            <span className="text-[10px] font-medium text-white/40">total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5 text-[10px] font-medium text-white/40">
          <span>Less</span>
          <div className="flex items-center gap-[2px]">
            {INTENSITY_COLORS.map((colorClass, idx) => (
              <div
                key={idx}
                className={cn("rounded-[2px]", colorClass)}
                style={{ width: `${isMobile ? 8 : 10}px`, height: `${isMobile ? 8 : 10}px` }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
