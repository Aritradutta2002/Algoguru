import React, { useMemo } from 'react';
import { AppTooltip } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface ActivityHeatmapProps {
  completedDates: string[]; // ISO date strings
}

export function ActivityHeatmap({ completedDates }: ActivityHeatmapProps) {
  // Generate the last 365 days grid
  const { weeks, activeDays, maxStreak, totalSubmissions, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    
    // Normalize dates and count
    const activityMap: Record<string, number> = {};
    let totalSubs = 0;
    
    completedDates.forEach(dateStr => {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        activityMap[key] = (activityMap[key] || 0) + 1;
        totalSubs++;
      }
    });

    const days = [];
    let currentStreak = 0;
    let maxStr = 0;
    let actDays = 0;
    
    for (let i = 0; i < 365; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const count = activityMap[key] || 0;
      
      if (count > 0) {
        currentStreak++;
        actDays++;
        if (currentStreak > maxStr) maxStr = currentStreak;
      } else {
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

    // Organize into columns (weeks). 7 days per column.
    const columns = [];
    let currentWeek = [];
    const mLabels: { label: string, colIndex: number }[] = [];
    
    days.forEach((day, idx) => {
      if (day.isFirstOfMonth) {
        mLabels.push({ label: day.month, colIndex: columns.length });
      }
      
      currentWeek.push(day);
      if (currentWeek.length === 7 || idx === days.length - 1) {
        // Pad the first week if necessary? GitHub pad empty days, but here we just start from 365 days ago, so first column might have < 7 days.
        // We'll pad the beginning if we want it to align to Sunday. 
        // For simplicity, we just render it as is.
        columns.push(currentWeek);
        currentWeek = [];
      }
    });

    return { 
      weeks: columns, 
      activeDays: actDays, 
      maxStreak: maxStr, 
      totalSubmissions: totalSubs,
      monthLabels: mLabels 
    };
  }, [completedDates]);

  return (
    <div className="w-full flex flex-col font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h3 className="text-sm font-semibold text-white/90">
          {totalSubmissions} submissions in the last 12 months
        </h3>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-xs font-semibold text-white/70 bg-[#262626] border border-white/10 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors">
            Last 12 months <ChevronDown size={14} />
          </button>
          <div className="flex bg-[#262626] rounded-full p-0.5 border border-white/5">
            <button className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/10 text-white">TUF</button>
            <button className="text-[10px] font-bold px-3 py-1 rounded-full text-white/40 hover:text-white/80 transition-colors">LeetCode</button>
          </div>
        </div>
      </div>
      
      {/* Heatmap Grid */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 pb-4">
        <div className="min-w-max relative flex flex-col">
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
                {week.map((day, dIdx) => (
                  <AppTooltip 
                    key={dIdx} 
                    content={`${day.count} ${day.count === 1 ? 'submission' : 'submissions'} on ${day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    side="top"
                  >
                    <div 
                      className={cn(
                        "w-3 h-3 rounded-[2px] transition-all duration-300 hover:ring-2 hover:ring-white/50 cursor-crosshair",
                        day.count > 0 ? "bg-[#22c55e]" : "bg-[#262626]"
                      )}
                    />
                  </AppTooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer / Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mt-6 pt-4 border-t border-white/5">
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
