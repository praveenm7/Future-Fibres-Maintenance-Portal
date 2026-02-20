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
import { toast } from 'sonner';

// Schedule components
import { ScheduleSummaryBar } from '@/components/schedule/ScheduleSummaryBar';
import { ScheduleGantt } from '@/components/schedule/ScheduleGantt';
import { ScheduleTable } from '@/components/schedule/ScheduleTable';
import { ScheduleUnscheduled } from '@/components/schedule/ScheduleUnscheduled';
import { ScheduleConfigSheet } from '@/components/schedule/ScheduleConfigSheet';
import { ScheduleTaskSheet } from '@/components/schedule/ScheduleTaskSheet';
import { useDailySchedule } from '@/hooks/useDailySchedule';
import { useMaintenanceExecutions } from '@/hooks/useMaintenanceExecutions';
import { useQueryClient } from '@tanstack/react-query';
import type { ScheduleConfig, ScheduledTask } from '@/types/schedule';

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

  // Schedule sub-view state (only relevant when viewMode === 'day')
  const [daySubView, setDaySubView] = useState<'tasks' | 'schedule'>('tasks');
  const [scheduleViewMode, setScheduleViewMode] = useState<'gantt' | 'table'>('gantt');
  const [scheduleConfigOpen, setScheduleConfigOpen] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<Partial<ScheduleConfig>>({
    breakDuration: 30,
  });
  const [selectedScheduleTask, setSelectedScheduleTask] = useState<ScheduledTask | null>(null);

  // Data
  const { eventsByDate, daysWithEvents, isLoading, machines, totalActions, totalMachines, upsertExecution, deleteExecution } =
    useCalendarEvents(currentDate, viewMode);

  // Schedule data (only fetched when in day+schedule mode)
  const dateKey = getDateKey(currentDate);
  const { data: dailySchedule, isLoading: scheduleLoading, error: scheduleError } =
    useDailySchedule(
      viewMode === 'day' && daySubView === 'schedule' ? dateKey : '',
      scheduleConfig
    );

  // Schedule completion mutations
  const { useUpsertExecution, useDeleteExecution } = useMaintenanceExecutions();
  const scheduleUpsert = useUpsertExecution();
  const scheduleDelete = useDeleteExecution();
  const queryClient = useQueryClient();

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

  // Event click → open detail sheet (calendar events)
  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedScheduleTask(null);
    setSelectedEvent(event);
  }, []);

  // Quick toggle complete from DayView
  const handleToggleComplete = useCallback(
    (event: CalendarEvent) => {
      if (event.execution?.status === 'COMPLETED') {
        // Undo: delete the execution record
        deleteExecution.mutate(event.execution.id, {
          onSuccess: () => {
            toast.success('Task marked as pending');
          },
        });
      } else {
        // Complete: upsert with default time
        upsertExecution.mutate({
          actionId: event.action.id,
          machineId: event.machine.id,
          scheduledDate: event.dateKey,
          status: 'COMPLETED',
          actualTime: event.action.timeNeeded,
        }, {
          onSuccess: () => {
            toast.success('Task marked as complete');
          },
        });
      }
    },
    [upsertExecution, deleteExecution]
  );

  // Full complete with details from EventDetailSheet
  const handleCompleteWithDetails = useCallback(
    (event: CalendarEvent, data: {
      status: 'COMPLETED' | 'SKIPPED';
      actualTime: number | null;
      completedById: string | null;
      notes: string | null;
    }) => {
      upsertExecution.mutate({
        actionId: event.action.id,
        machineId: event.machine.id,
        scheduledDate: event.dateKey,
        ...data,
      }, {
        onSuccess: () => {
          toast.success(data.status === 'COMPLETED' ? 'Task marked as complete' : 'Task marked as skipped');
        },
      });
    },
    [upsertExecution]
  );

  // Undo complete from EventDetailSheet
  const handleUndoComplete = useCallback(
    (event: CalendarEvent) => {
      if (event.execution) {
        deleteExecution.mutate(event.execution.id, {
          onSuccess: () => {
            toast.success('Task reverted to pending');
            setSelectedEvent(null);
          },
        });
      }
    },
    [deleteExecution]
  );

  // Schedule task click → open schedule detail sheet
  const handleScheduleTaskClick = useCallback((task: ScheduledTask) => {
    setSelectedEvent(null);
    setSelectedScheduleTask(task);
  }, []);

  // Schedule task completion
  const handleScheduleComplete = useCallback((task: ScheduledTask, data: {
    status: 'COMPLETED' | 'SKIPPED';
    actualTime: number | null;
    completedById: string | null;
    notes: string | null;
  }) => {
    scheduleUpsert.mutate({
      actionId: task.actionId,
      machineId: task.machineId,
      scheduledDate: dateKey,
      ...data,
    }, {
      onSuccess: () => {
        toast.success(data.status === 'COMPLETED' ? 'Task marked as complete' : 'Task marked as skipped');
        queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
        setSelectedScheduleTask(null);
      },
    });
  }, [scheduleUpsert, dateKey, queryClient]);

  // Schedule task undo completion
  const handleScheduleUndoComplete = useCallback((task: ScheduledTask) => {
    if (task.executionId) {
      scheduleDelete.mutate(task.executionId, {
        onSuccess: () => {
          toast.success('Task reverted to pending');
          queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
          setSelectedScheduleTask(null);
        },
      });
    }
  }, [scheduleDelete, queryClient]);

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
        daySubView={daySubView}
        onDaySubViewChange={setDaySubView}
        scheduleViewMode={scheduleViewMode}
        onScheduleViewModeChange={setScheduleViewMode}
        onScheduleConfigOpen={() => setScheduleConfigOpen(true)}
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

          {/* Day view: Tasks sub-view */}
          {viewMode === 'day' && daySubView === 'tasks' && (
            <DayView
              currentDate={currentDate}
              events={currentDayEvents}
              onEventClick={handleEventClick}
              onToggleComplete={handleToggleComplete}
            />
          )}

          {/* Day view: Schedule sub-view */}
          {viewMode === 'day' && daySubView === 'schedule' && (
            <div className="space-y-3">
              {scheduleLoading && (
                <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground text-sm">Computing schedule...</p>
                </div>
              )}

              {scheduleError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
                  Failed to load schedule: {(scheduleError as Error).message}
                </div>
              )}

              {dailySchedule && (
                <>
                  <ScheduleSummaryBar summary={dailySchedule.summary} />

                  {scheduleViewMode === 'gantt' ? (
                    <ScheduleGantt schedule={dailySchedule} onTaskClick={handleScheduleTaskClick} />
                  ) : (
                    <ScheduleTable schedule={dailySchedule} onTaskClick={handleScheduleTaskClick} />
                  )}

                  <ScheduleUnscheduled tasks={dailySchedule.unscheduled} />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Sheet (calendar tasks) */}
      <EventDetailSheet
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
        onComplete={handleCompleteWithDetails}
        onUndoComplete={handleUndoComplete}
      />

      {/* Schedule Task Sheet (schedule tasks) */}
      <ScheduleTaskSheet
        task={selectedScheduleTask}
        open={!!selectedScheduleTask}
        onOpenChange={(open) => {
          if (!open) setSelectedScheduleTask(null);
        }}
        onComplete={handleScheduleComplete}
        onUndoComplete={handleScheduleUndoComplete}
      />

      {/* Schedule Config Sheet */}
      <ScheduleConfigSheet
        open={scheduleConfigOpen}
        onClose={() => setScheduleConfigOpen(false)}
        config={scheduleConfig}
        onConfigChange={setScheduleConfig}
        date={dateKey}
      />
    </div>
  );
}
