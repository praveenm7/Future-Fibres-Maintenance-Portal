import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent, getDateKey, ALL_PERIODICITIES, PERIODICITY_COLORS } from './calendarUtils';
import { DayCell } from './DayCell';
import type { TaskTiming } from '@/types/schedule';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthViewProps {
  currentDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreateAction?: (date: Date) => void;
  timings?: Record<string, TaskTiming>;
}

export function MonthView({
  currentDate,
  eventsByDate,
  onDateClick,
  onEventClick,
  onCreateAction,
  timings,
}: MonthViewProps) {
  const visibleDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  // Month-level summary
  const monthSummary = useMemo(() => {
    let total = 0;
    let completed = 0;
    let mandatory = 0;
    for (const day of visibleDays) {
      const key = getDateKey(day);
      const events = eventsByDate[key] || [];
      total += events.length;
      completed += events.filter(e => e.execution?.status === 'COMPLETED').length;
      mandatory += events.filter(e => e.action.status === 'MANDATORY' && e.execution?.status !== 'COMPLETED').length;
    }
    return { total, completed, mandatory };
  }, [visibleDays, eventsByDate]);

  return (
    <div className="space-y-2">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-muted-foreground bg-muted/30"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {visibleDays.map((day) => {
            const key = getDateKey(day);
            return (
              <DayCell
                key={key}
                date={day}
                events={eventsByDate[key] || []}
                currentMonth={currentDate}
                onDateClick={onDateClick}
                onEventClick={onEventClick}
                onCreateAction={onCreateAction}
                timings={timings}
              />
            );
          })}
        </div>
      </div>

      {/* Legend + summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          {ALL_PERIODICITIES.map((p) => (
            <div key={p} className="flex items-center gap-1">
              <div className={cn('h-2.5 w-2.5 rounded-full', PERIODICITY_COLORS[p].dot)} />
              <span className="text-[10px] text-muted-foreground">{PERIODICITY_COLORS[p].label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>{monthSummary.total} tasks</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{monthSummary.completed} done</span>
          {monthSummary.mandatory > 0 && (
            <span className="text-red-600 dark:text-red-400 font-medium">{monthSummary.mandatory} required</span>
          )}
        </div>
      </div>
    </div>
  );
}
