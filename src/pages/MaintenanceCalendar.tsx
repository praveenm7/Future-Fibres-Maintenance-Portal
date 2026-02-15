import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ViewMode,
  CalendarEvent,
  navigateDate,
  getDateKey,
} from '@/components/calendar/calendarUtils';
import { useCalendarEvents } from '@/components/calendar/useCalendarEvents';
import { useCalendarFilters } from '@/components/calendar/useCalendarFilters';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { EventDetailSheet } from '@/components/calendar/EventDetailSheet';

export default function MaintenanceCalendar() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Sidebar
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Event detail sheet
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  // Data
  const { eventsByDate, daysWithEvents, isLoading, machines, totalActions, totalMachines } =
    useCalendarEvents(currentDate, viewMode);

  // Filters
  const {
    filters,
    setFilter,
    clearFilters,
    applyFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useCalendarFilters();

  // Apply filters to events
  const filteredEventsByDate = useMemo(() => {
    if (!hasActiveFilters) return eventsByDate;

    const result: Record<string, CalendarEvent[]> = {};
    for (const [key, events] of Object.entries(eventsByDate)) {
      const filtered = applyFilters(events);
      if (filtered.length > 0) {
        result[key] = filtered;
      }
    }
    return result;
  }, [eventsByDate, applyFilters, hasActiveFilters]);

  // Filtered events for day view
  const currentDayEvents = useMemo(() => {
    const key = getDateKey(currentDate);
    return filteredEventsByDate[key] || [];
  }, [filteredEventsByDate, currentDate]);

  // Unique areas from machines
  const areas = useMemo(() => {
    const areaSet = new Set(machines.map((m) => m.area).filter(Boolean));
    return Array.from(areaSet).sort();
  }, [machines]);

  // Navigation
  const handleNavigate = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      setCurrentDate(navigateDate(currentDate, viewMode, direction));
    },
    [currentDate, viewMode]
  );

  // Clicking a day number → switch to day view
  const handleDateClick = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      setSelectedDate(date);
      setViewMode('day');
    },
    []
  );

  // Selecting date from mini calendar
  const handleSidebarDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        setSelectedDate(date);
        setCurrentDate(date);
      }
    },
    []
  );

  // Event click → open detail sheet
  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading calendar data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader
        title="Maintenance Calendar"
        subtitle={`${totalActions} actions across ${totalMachines} machines`}
      />

      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNavigate={handleNavigate}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
        activeFilterCount={activeFilterCount}
      />

      <div className="flex flex-1 min-h-0 -mx-4 md:-mx-6 lg:-mx-8">
        {/* Sidebar */}
        <CalendarSidebar
          isOpen={sidebarOpen}
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDateSelect={handleSidebarDateSelect}
          onMonthChange={setCurrentDate}
          daysWithEvents={daysWithEvents}
          filters={filters}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          areas={areas}
          machines={machines}
        />

        {/* Main View */}
        <div className="flex-1 min-w-0 p-4 overflow-y-auto">
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              eventsByDate={filteredEventsByDate}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              eventsByDate={filteredEventsByDate}
              onEventClick={handleEventClick}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              events={currentDayEvents}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>

      {/* Event Detail Sheet */}
      <EventDetailSheet
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
    </div>
  );
}
