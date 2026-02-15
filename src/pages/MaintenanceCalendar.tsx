import { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMachines } from '@/hooks/useMachines';
import { useMaintenanceActions } from '@/hooks/useMaintenanceActions';
import { MaintenanceAction, Machine } from '@/types/maintenance';
import { Loader2, Calendar, Clock, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

// Map periodicity to days between occurrences
const PERIODICITY_DAYS: Record<string, number> = {
  'BEFORE EACH USE': 1,
  'WEEKLY': 7,
  'MONTHLY': 30,
  'QUARTERLY': 90,
  'YEARLY': 365,
};

interface CalendarEvent {
  action: MaintenanceAction;
  machine: Machine;
  date: Date;
}

export default function MaintenanceCalendar() {
  const { useGetMachines } = useMachines();
  const { useGetActions } = useMaintenanceActions();

  const { data: machines = [], isLoading: loadingMachines } = useGetMachines();
  const { data: allActions = [], isLoading: loadingActions } = useGetActions();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate events for the current month view
  const events = useMemo(() => {
    if (!machines.length || !allActions.length) return [];

    const result: CalendarEvent[] = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    for (const action of allActions) {
      const machine = machines.find(m => m.id === action.machineId);
      if (!machine) continue;

      const intervalDays = PERIODICITY_DAYS[action.periodicity] || 30;

      // Generate dates for this action in the current month
      let date = new Date(startOfMonth);
      while (date <= endOfMonth) {
        result.push({
          action,
          machine,
          date: new Date(date),
        });
        date.setDate(date.getDate() + intervalDays);
      }
    }

    return result;
  }, [machines, allActions, currentMonth]);

  // Group events by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const key = event.date.toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(event);
    }
    return map;
  }, [events]);

  // Days with events for highlighting
  const daysWithEvents = useMemo(() => {
    return Object.keys(eventsByDate).map(d => new Date(d));
  }, [eventsByDate]);

  // Events for selected date
  const selectedDateKey = selectedDate?.toISOString().split('T')[0];
  const selectedEvents = selectedDateKey ? (eventsByDate[selectedDateKey] || []) : [];

  const isLoading = loadingMachines || loadingActions;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading calendar data...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Maintenance Calendar" subtitle={`${allActions.length} actions across ${machines.length} machines`} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Calendar */}
        <div className="bg-card border border-border rounded-lg p-4">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={{
              hasEvents: daysWithEvents,
            }}
            modifiersStyles={{
              hasEvents: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: 'hsl(var(--primary))',
                textUnderlineOffset: '3px',
              },
            }}
            className="mx-auto"
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4 w-full',
              caption: 'flex justify-center pt-1 relative items-center text-foreground',
              caption_label: 'text-sm font-medium',
              nav: 'space-x-1 flex items-center',
              nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-muted',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex w-full',
              head_cell: 'text-muted-foreground rounded-md w-full font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'h-9 w-full text-center text-sm relative focus-within:z-20',
              day: 'h-9 w-9 p-0 font-normal inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors mx-auto',
              day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90',
              day_today: 'bg-accent text-accent-foreground',
              day_outside: 'text-muted-foreground opacity-50',
              day_disabled: 'text-muted-foreground opacity-50',
            }}
          />

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-accent" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold underline">1</span>
              <span>Has actions</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="space-y-4">
          {!selectedDate ? (
            <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm font-medium text-muted-foreground">Select a day</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click a date to see scheduled actions</p>
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="section-header flex items-center justify-between">
                  <span>{selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="text-xs font-normal text-muted-foreground">{selectedEvents.length} actions</span>
                </div>

                {selectedEvents.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No maintenance actions scheduled for this day.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {selectedEvents.map((event, i) => (
                      <div key={`${event.action.id}-${i}`} className="p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "mt-0.5 h-2 w-2 rounded-full flex-shrink-0",
                            event.action.periodicity === 'BEFORE EACH USE' ? 'bg-blue-500' :
                            event.action.periodicity === 'WEEKLY' ? 'bg-green-500' :
                            event.action.periodicity === 'MONTHLY' ? 'bg-amber-500' :
                            event.action.periodicity === 'QUARTERLY' ? 'bg-purple-500' : 'bg-red-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{event.action.action}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {event.machine.finalCode} — {event.machine.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {event.action.timeNeeded} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Wrench className="h-3 w-3" /> {event.action.periodicity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary by periodicity */}
              {selectedEvents.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Summary</p>
                  <div className="space-y-1">
                    {Object.entries(
                      selectedEvents.reduce((acc, e) => {
                        acc[e.action.periodicity] = (acc[e.action.periodicity] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([period, count]) => (
                      <div key={period} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{period}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border font-medium">
                      <span>Total time</span>
                      <span>{selectedEvents.reduce((sum, e) => sum + e.action.timeNeeded, 0)} min</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
