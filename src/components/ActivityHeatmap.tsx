import React, { useMemo } from 'react';
import { AppTooltip } from './ui/tooltip';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  completedDates: string[]; // ISO date strings
}

export function ActivityHeatmap({ completedDates }: ActivityHeatmapProps) {
  // Generate the last 365 days grid
  const { weeks, maxCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    
    // Ensure the grid starts on a Sunday for consistency (optional, but typical for Github style)
    // Actually we can just display exactly 365 days, which means 52 weeks and 1 day.
    // Let's just create 365 days ending today.
    
    const activityMap: Record<string, number> = {};
    completedDates.forEach(dateStr => {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        activityMap[key] = (activityMap[key] || 0) + 1;
      }
    });

    let localMax = 1;
    const days = [];
    for (let i = 0; i < 365; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const count = activityMap[key] || 0;
      if (count > localMax) localMax = count;
      
      days.push({
        date: current,
        dateString: key,
        count: count
      });
    }

    // Organize into columns (weeks). 7 days per column.
    // The first column might not start on Sunday, but that's fine, we'll just stack them.
    const columns = [];
    let currentWeek = [];
    
    days.forEach((day, idx) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || idx === days.length - 1) {
        columns.push(currentWeek);
        currentWeek = [];
      }
    });

    return { weeks: columns, maxCount: localMax };
  }, [completedDates]);

  const getIntensityClass = (count: number, max: number) => {
    if (count === 0) return 'bg-muted/30 border-border/10';
    const ratio = count / max;
    if (ratio <= 0.25) return 'bg-primary/30 border-primary/20';
    if (ratio <= 0.5) return 'bg-primary/50 border-primary/30';
    if (ratio <= 0.75) return 'bg-primary/80 border-primary/50';
    return 'bg-primary border-primary';
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          Activity Heatmap
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last 365 Days</span>
      </div>
      
      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted">
        <div className="flex gap-1.5 min-w-max">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day, dIdx) => (
                <AppTooltip 
                  key={dIdx} 
                  content={`${day.count} ${day.count === 1 ? 'activity' : 'activities'} on ${day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  side="top"
                >
                  <div 
                    className={cn(
                      "w-3.5 h-3.5 rounded-[3px] border transition-all duration-300 hover:scale-125 hover:z-10 cursor-crosshair",
                      getIntensityClass(day.count, maxCount)
                    )}
                  />
                </AppTooltip>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[2px] bg-muted/30 border border-border/10" />
          <div className="w-3 h-3 rounded-[2px] bg-primary/30 border border-primary/20" />
          <div className="w-3 h-3 rounded-[2px] bg-primary/50 border border-primary/30" />
          <div className="w-3 h-3 rounded-[2px] bg-primary/80 border border-primary/50" />
          <div className="w-3 h-3 rounded-[2px] bg-primary border border-primary" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
