import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Machine } from '@/types/maintenance';
import { PERIODICITY_COLORS, ALL_PERIODICITIES } from './calendarUtils';
import { CalendarFilters } from './CalendarFilters';
import { CalendarFilterState } from './useCalendarFilters';

interface CalendarSidebarProps {
  isOpen: boolean;
  currentDate: Date;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onMonthChange: (date: Date) => void;
  daysWithEvents: Date[];
  filters: CalendarFilterState;
  onFilterChange: <K extends keyof CalendarFilterState>(
    key: K,
    value: CalendarFilterState[K]
  ) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  areas: string[];
  machines: Machine[];
}

export function CalendarSidebar({
  isOpen,
  currentDate,
  selectedDate,
  onDateSelect,
  onMonthChange,
  daysWithEvents,
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
  areas,
  machines,
}: CalendarSidebarProps) {
  return (
    <div
      className={cn(
        'border-r border-border bg-card transition-all duration-300 overflow-hidden flex flex-col flex-shrink-0',
        isOpen ? 'w-72' : 'w-0'
      )}
    >
      {/* Mini Calendar */}
      <div className="p-2 border-b border-border flex-shrink-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          month={currentDate}
          onMonthChange={onMonthChange}
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
        />
      </div>

      {/* Filters */}
      <ScrollArea className="flex-1">
        <div className="border-b border-border">
          <div className="section-header text-xs">Filters</div>
          <CalendarFilters
            filters={filters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            areas={areas}
            machines={machines}
          />
        </div>

        {/* Legend */}
        <div>
          <div className="section-header text-xs">Legend</div>
          <div className="p-3 space-y-3">
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Periodicity
              </p>
              {ALL_PERIODICITIES.map((p) => {
                const colors = PERIODICITY_COLORS[p];
                return (
                  <div key={p} className="flex items-center gap-2 text-xs">
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        colors.dot
                      )}
                    />
                    <span className="text-muted-foreground">
                      {colors.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Workload
              </p>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-5 rounded bg-blue-50 dark:bg-blue-950/30 border border-border" />
                <span className="text-muted-foreground">Low (1-3)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-5 rounded bg-amber-50 dark:bg-amber-950/30 border border-border" />
                <span className="text-muted-foreground">Medium (4-6)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-5 rounded bg-red-50 dark:bg-red-950/30 border border-border" />
                <span className="text-muted-foreground">High (7+)</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
