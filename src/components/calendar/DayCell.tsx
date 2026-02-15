import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  CalendarEvent,
  getWorkloadIntensity,
  formatTimeMinutes,
  isToday,
  isSameMonth,
} from './calendarUtils';
import { EventChip } from './EventChip';

const MAX_VISIBLE_EVENTS = 3;

interface DayCellProps {
  date: Date;
  events: CalendarEvent[];
  currentMonth: Date;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export const DayCell = memo(function DayCell({
  date,
  events,
  currentMonth,
  onDateClick,
  onEventClick,
}: DayCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  const totalTime = events.reduce((sum, e) => sum + e.action.timeNeeded, 0);
  const overflow = events.length - MAX_VISIBLE_EVENTS;

  return (
    <div
      className={cn(
        'min-h-[100px] lg:min-h-[120px] border-b border-r border-border p-1 transition-colors',
        getWorkloadIntensity(events.length),
        !isCurrentMonth && 'opacity-40'
      )}
    >
      {/* Day header */}
      <div className="flex items-center justify-between mb-0.5">
        <button
          type="button"
          onClick={() => onDateClick(date)}
          className={cn(
            'h-6 w-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors',
            'hover:bg-primary hover:text-primary-foreground',
            today &&
              'bg-primary text-primary-foreground font-bold'
          )}
        >
          {date.getDate()}
        </button>
        {totalTime > 0 && (
          <span className="text-[10px] text-muted-foreground font-medium px-1">
            {formatTimeMinutes(totalTime)}
          </span>
        )}
      </div>

      {/* Event chips */}
      <div className="space-y-0.5">
        {events.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
          <EventChip
            key={event.id}
            event={event}
            compact
            onClick={onEventClick}
          />
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => onDateClick(date)}
            className="text-[10px] text-primary font-medium hover:underline px-1.5"
          >
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
});
