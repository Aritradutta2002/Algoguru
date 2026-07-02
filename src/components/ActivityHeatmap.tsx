import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AppTooltip } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronDown, Loader2 } from 'lucide-react';

type HeatmapMode = "website" | "leetcode" | "codechef";

interface ActivityHeatmapProps {
  websiteCalendar?: Record<string, number>; // YYYY-MM-DD -> count (Website / Sheet mode)
  leetcodeCalendar?: Record<string, number>; // timestamp -> count (LeetCode mode)
  codechefCalendar?: Record<string, number>; // YYYY-MM-DD -> count (CodeChef mode)
  dataMode: HeatmapMode;
  onModeChange: (mode: HeatmapMode) => void;
  isLoading?: boolean;
}

type YearOption = "Last 12 months" | number;

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

  // Close dropdown on outside click
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

  // Generate grid based on selected year
  const { weeks, activeDays, maxStreak, totalSubmissions, monthLabels } = useMemo(() => {
    let startDate: Date;
    let daysInGrid = 365;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedYear === "Last 12 months") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 364);
    } else {
      startDate = new Date(selectedYear, 0, 1); // Jan 1st of selected year
      const isLeapYear = (selectedYear % 4 === 0 && selectedYear % 100 !== 0) || (selectedYear % 400 === 0);
      daysInGrid = isLeapYear ? 366 : 365;
    }

    // Normalize dates and count
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
      // Website (sheet) and CodeChef modes both use a YYYY-MM-DD -> count mapping.
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

    const days = [];
    let currentStreak = 0;
    let maxStr = 0;
    let actDays = 0;
    let rangeSubs = 0;
    
    for (let i = 0; i < daysInGrid; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      
      const isFuture = current > today;
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const count = activityMap[key] || 0;
      
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
    const columns = [];
    let currentWeek = [];
    const mLabels: { label: string, colIndex: number }[] = [];
    
    const firstDayOfWeek = days[0].date.getDay(); // 0 is Sunday
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null); // padding
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
      monthLabels: mLabels 
    };
  }, [websiteCalendar, leetcodeCalendar, codechefCalendar, dataMode, selectedYear]);

  return (
    <div className="w-full flex flex-col font-sans h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h3 className="text-sm font-semibold text-white/90">
          {totalSubmissions} submissions in {selectedYear === "Last 12 months" ? "the last 12 months" : selectedYear}
        </h3>
        <div className="flex items-center gap-4">
          {/* Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-xs font-semibold text-white/70 bg-[#262626] border border-white/10 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
            >
              {selectedYear} <ChevronDown size={14} className={cn("transition-transform", isDropdownOpen && "rotate-180")} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-[#262626] border border-white/10 rounded-md shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                {yearOptions.map(year => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-xs font-medium hover:bg-white/10 transition-colors",
                      selectedYear === year ? "text-white bg-white/5" : "text-white/60"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Toggle */}
          <div className="flex bg-[#262626] rounded-full p-0.5 border border-white/5">
            <button 
              onClick={() => onModeChange("website")}
              className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-full transition-all",
                dataMode === "website" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"
              )}
            >
              Website
            </button>
            <button 
              onClick={() => onModeChange("leetcode")}
              className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-full transition-all",
                dataMode === "leetcode" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"
              )}
            >
              LeetCode
            </button>
            <button 
              onClick={() => onModeChange("codechef")}
              className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-full transition-all",
                dataMode === "codechef" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"
              )}
            >
              CodeChef
            </button>
          </div>
        </div>
      </div>
      
      {/* Heatmap Grid */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 pb-4 relative min-h-[140px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1C1C1C]/50 backdrop-blur-sm rounded-md">
            <Loader2 className="animate-spin text-white/40" size={24} />
          </div>
        )}
        
        <div className={cn("min-w-max relative flex flex-col", isLoading && "opacity-30")}>
          {/* Months Row */}
          <div className="flex mb-2 h-4 relative">
            {monthLabels.map((ml, i) => (
              <div 
                key={i} 
                className="absolute text-[10px] text-white/40"
                style={{ left: `${ml.colIndex * (12 + 4)}px` }} // 12px width + 4px gap = 16px per col
              >
                {ml.label}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="flex gap-1 items-start">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => {
                  if (!day) {
                    return <div key={dIdx} className="w-3 h-3" />; // Empty padding cell
                  }
                  
                  return (
                    <AppTooltip 
                      key={dIdx} 
                      content={`${day.count} ${day.count === 1 ? 'submission' : 'submissions'} on ${day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      side="top"
                    >
                      <div 
                        className={cn(
                          "w-3 h-3 rounded-[2px] transition-all duration-300 hover:ring-2 hover:ring-white/50 cursor-crosshair",
                          day.count > 0 ? "bg-[#22c55e]" : "bg-[#262626]",
                          day.date > new Date() && "opacity-20" // Future dates dim
                        )}
                      />
                    </AppTooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer / Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs font-medium text-white/40">
          <span>Active Days <span className="text-white/80 ml-1">{activeDays}</span></span>
          <div className="w-px h-3 bg-white/20" />
          <span>Max Streak <span className="text-white/80 ml-1">{maxStreak}</span></span>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0 text-[10px] font-medium text-white/40">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-[2px] bg-[#262626]" />
            <span>Not visited yet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-[2px] bg-[#22c55e]" />
            <span>Achieved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
