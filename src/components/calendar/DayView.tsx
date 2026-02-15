import { useMemo } from 'react';
import { ChevronRight, Clock, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  CalendarEvent,
  PERIODICITY_COLORS,
  ALL_PERIODICITIES,
  format,
  formatTimeMinutes,
} from './calendarUtils';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  // Group events by machine
  const machineGroups = useMemo(() => {
    const map = new Map<
      string,
      { machine: CalendarEvent['machine']; events: CalendarEvent[] }
    >();

    for (const event of events) {
      const machineId = event.machine.id;
      if (!map.has(machineId)) {
        map.set(machineId, { machine: event.machine, events: [] });
      }
      map.get(machineId)!.events.push(event);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.machine.finalCode.localeCompare(b.machine.finalCode)
    );
  }, [events]);

  // Periodicity breakdown
  const periodicityBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events) {
      const p = event.action.periodicity;
      counts[p] = (counts[p] || 0) + 1;
    }
    return ALL_PERIODICITIES
      .filter((p) => counts[p])
      .map((p) => ({ periodicity: p, count: counts[p] }));
  }, [events]);

  const totalTime = events.reduce((sum, e) => sum + e.action.timeNeeded, 0);

  return (
    <div className="space-y-4">
      {/* Day summary bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {events.length} action{events.length !== 1 ? 's' : ''} &middot;{' '}
              {formatTimeMinutes(totalTime)} total
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {periodicityBreakdown.map(({ periodicity, count }) => {
              const colors = PERIODICITY_COLORS[periodicity];
              return (
                <Badge
                  key={periodicity}
                  variant="secondary"
                  className={cn(
                    colors.bg,
                    colors.text,
                    'border',
                    colors.border,
                    'text-xs'
                  )}
                >
                  {count} {colors.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      {/* Machine groups */}
      {machineGroups.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center">
          <Wrench className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground">
            No maintenance actions scheduled
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            This day has no scheduled maintenance tasks
          </p>
        </div>
      ) : (
        machineGroups.map(({ machine, events: machineEvents }) => {
          const machineTime = machineEvents.reduce(
            (sum, e) => sum + e.action.timeNeeded,
            0
          );

          return (
            <div
              key={machine.id}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              {/* Machine header */}
              <div className="section-header flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {machine.imageUrl ? (
                    <img
                      src={machine.imageUrl}
                      alt={machine.finalCode}
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                      <Wrench className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className="font-mono font-bold text-sm">
                    {machine.finalCode}
                  </span>
                  <span className="text-muted-foreground text-sm truncate">
                    {machine.description}
                  </span>
                </div>
                <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {machineEvents.length} action
                  {machineEvents.length !== 1 ? 's' : ''} &middot;{' '}
                  {formatTimeMinutes(machineTime)}
                </span>
              </div>

              {/* Action list */}
              <div className="divide-y divide-border">
                {machineEvents.map((event) => {
                  const colors =
                    PERIODICITY_COLORS[event.action.periodicity];
                  const isMandatory = event.action.status === 'MANDATORY';

                  return (
                    <button
                      type="button"
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left p-3 hover:bg-muted/30 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <div
                        className={cn(
                          'h-2.5 w-2.5 rounded-full flex-shrink-0',
                          colors.dot
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {event.action.action}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeMinutes(event.action.timeNeeded)}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              colors.bg,
                              colors.text,
                              'text-[10px] px-1.5 py-0 border',
                              colors.border
                            )}
                          >
                            {colors.label}
                          </Badge>
                          {isMandatory && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] px-1.5 py-0"
                            >
                              Mandatory
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
