import { useMemo } from 'react';
import { Check, ChevronRight, Circle, Clock, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVER_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api').replace('/api', '');

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
  onToggleComplete?: (event: CalendarEvent) => void;
}

export function DayView({ currentDate, events, onEventClick, onToggleComplete }: DayViewProps) {
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
  const completedCount = events.filter((e) => e.execution?.status === 'COMPLETED').length;

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
              {events.length} action{events.length !== 1 ? 's' : ''}
              {completedCount > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400"> &middot; {completedCount} completed</span>
              )}
              {' '}&middot; {formatTimeMinutes(totalTime)} total
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
          const machineCompleted = machineEvents.filter((e) => e.execution?.status === 'COMPLETED').length;

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
                      src={machine.imageUrl.startsWith('http') ? machine.imageUrl : `${SERVER_BASE}${machine.imageUrl}`}
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
                  {machineCompleted > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {machineCompleted}/{machineEvents.length}
                    </span>
                  )}
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
                  const isCompleted = event.execution?.status === 'COMPLETED';
                  const isSkipped = event.execution?.status === 'SKIPPED';

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'flex items-center gap-3 transition-colors',
                        isCompleted && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                        isSkipped && 'bg-muted/30 opacity-60'
                      )}
                    >
                      {/* Quick complete checkbox */}
                      {onToggleComplete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(event);
                          }}
                          className={cn(
                            'ml-3 flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer',
                            'hover:scale-110',
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-muted-foreground/30 hover:border-emerald-400'
                          )}
                        >
                          {isCompleted && <Check className="h-3 w-3" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEventClick(event)}
                        className={cn(
                          'flex-1 text-left p-3 hover:bg-muted/30 transition-colors flex items-center gap-3 cursor-pointer',
                          onToggleComplete && 'pl-0'
                        )}
                      >
                        <div
                          className={cn(
                            'h-2.5 w-2.5 rounded-full flex-shrink-0',
                            colors.dot
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            isCompleted && 'line-through text-muted-foreground'
                          )}>
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
                            {isCompleted && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                                Done
                              </Badge>
                            )}
                            {isSkipped && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Skipped
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    </div>
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
