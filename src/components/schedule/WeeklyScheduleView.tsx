import { useState, useMemo, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, Shield, Lightbulb, AlertTriangle, Clock, Users, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WeeklySchedule, ScheduledTask } from '@/types/schedule';
import { ScheduleSummaryBar } from './ScheduleSummaryBar';
import { ScheduleGantt } from './ScheduleGantt';
import { ScheduleTable } from './ScheduleTable';
import { ScheduleUnscheduled } from './ScheduleUnscheduled';
import { formatTimeMinutes } from '@/components/calendar/calendarUtils';

interface WeeklyScheduleViewProps {
  weeklySchedule: WeeklySchedule;
  isLoading: boolean;
  error: Error | null;
  scheduleViewMode: 'gantt' | 'table';
  onTaskClick: (task: ScheduledTask) => void;
  onSelectedDayChange?: (dateKey: string) => void;
}

export function WeeklyScheduleView({
  weeklySchedule,
  isLoading,
  error,
  scheduleViewMode,
  onTaskClick,
  onSelectedDayChange,
}: WeeklyScheduleViewProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const dayKeys = useMemo(() => {
    if (!weeklySchedule?.days) return [];
    return Object.keys(weeklySchedule.days).sort();
  }, [weeklySchedule]);

  const selectedDayKey = dayKeys[selectedDayIndex] || '';
  const selectedDay = weeklySchedule?.days?.[selectedDayKey];

  // Notify parent of selected day changes
  useEffect(() => {
    if (selectedDayKey && onSelectedDayChange) {
      onSelectedDayChange(selectedDayKey);
    }
  }, [selectedDayKey, onSelectedDayChange]);
  const weekSummary = weeklySchedule?.weekSummary;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Computing weekly schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
        Failed to load weekly schedule: {error.message}
      </div>
    );
  }

  if (!weeklySchedule || dayKeys.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No schedule data available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Week Summary Bar */}
      {weekSummary && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border">
          <span className="text-xs font-semibold text-foreground">Week Overview</span>
          <Badge variant="secondary" className="text-xs gap-1">
            <CalendarDays className="h-3 w-3" />
            {weekSummary.scheduledTasks}/{weekSummary.totalTasks}
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeMinutes(weekSummary.totalMinutes)}
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1 text-red-600">
            <Shield className="h-3 w-3" />
            {weekSummary.mandatoryCount}
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1 text-blue-600">
            <Lightbulb className="h-3 w-3" />
            {weekSummary.idealCount}
          </Badge>
          {weekSummary.unscheduledTasks > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              {weekSummary.unscheduledTasks} unscheduled
            </Badge>
          )}
        </div>
      )}

      {/* Day Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-0">
        {dayKeys.map((key, idx) => {
          const day = weeklySchedule.days[key];
          const dateObj = new Date(key + 'T00:00:00');
          const isSelected = idx === selectedDayIndex;
          const isToday = key === format(new Date(), 'yyyy-MM-dd');
          const hasUnscheduled = (day?.summary?.unscheduledTasks ?? 0) > 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDayIndex(idx)}
              className={cn(
                'flex flex-col items-center px-3 py-2 text-xs font-medium border-b-2 transition-colors min-w-[72px] shrink-0',
                isSelected
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                isToday && !isSelected && 'text-primary/70'
              )}
            >
              <span className="text-[10px] uppercase">
                {format(dateObj, 'EEE')}
              </span>
              <span className={cn('text-sm', isToday && 'font-bold')}>
                {format(dateObj, 'd')}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px]">
                  {day?.summary?.scheduledTasks ?? 0}/{day?.summary?.totalTasks ?? 0}
                </span>
                {hasUnscheduled && (
                  <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Content */}
      {selectedDay && (
        <>
          <ScheduleSummaryBar summary={selectedDay.summary} />

          {scheduleViewMode === 'gantt' ? (
            <ScheduleGantt schedule={selectedDay} onTaskClick={onTaskClick} />
          ) : (
            <ScheduleTable schedule={selectedDay} onTaskClick={onTaskClick} />
          )}

          <ScheduleUnscheduled tasks={selectedDay.unscheduled} />
        </>
      )}
    </div>
  );
}
