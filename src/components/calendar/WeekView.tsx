import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday as dateFnsIsToday,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CalendarEvent,
  getDateKey,
  format,
  formatTimeMinutes,
} from './calendarUtils';
import { EventChip } from './EventChip';

interface WeekViewProps {
  currentDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({
  currentDate,
  eventsByDate,
  onEventClick,
}: WeekViewProps) {
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  return (
    <div className="grid grid-cols-7 gap-2 h-full min-h-[400px]">
      {weekDays.map((day) => {
        const key = getDateKey(day);
        const events = eventsByDate[key] || [];
        const today = dateFnsIsToday(day);
        const totalTime = events.reduce(
          (sum, e) => sum + e.action.timeNeeded,
          0
        );

        return (
          <div
            key={key}
            className={cn(
              'flex flex-col border border-border rounded-lg overflow-hidden bg-card',
              today && 'ring-2 ring-primary/30'
            )}
          >
            {/* Column header */}
            <div
              className={cn(
                'px-2 py-2 text-center border-b border-border bg-muted/30',
                today && 'bg-primary/10'
              )}
            >
              <div className="text-xs text-muted-foreground font-medium">
                {format(day, 'EEE')}
              </div>
              <div
                className={cn(
                  'text-lg font-semibold',
                  today && 'text-primary'
                )}
              >
                {format(day, 'd')}
              </div>
              {totalTime > 0 && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {formatTimeMinutes(totalTime)}
                </div>
              )}
            </div>

            {/* Scrollable event list */}
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-1">
                {events.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">
                    No tasks
                  </p>
                ) : (
                  events.map((event) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      compact={false}
                      onClick={onEventClick}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Event count footer */}
            {events.length > 0 && (
              <div className="px-2 py-1 border-t border-border bg-muted/20 text-center">
                <span className="text-[10px] text-muted-foreground">
                  {events.length} task{events.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
