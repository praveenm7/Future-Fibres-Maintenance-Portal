import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
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
import { CalendarHeader, type TopLevelMode } from '@/components/calendar/CalendarHeader';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { EventDetailSheet } from '@/components/calendar/EventDetailSheet';
import { CreateActionSheet } from '@/components/calendar/CreateActionSheet';
import { toast } from 'sonner';

// Schedule components
import { ScheduleConfigSheet } from '@/components/schedule/ScheduleConfigSheet';
import { ScheduleTaskSheet } from '@/components/schedule/ScheduleTaskSheet';
import { WeeklyScheduleView } from '@/components/schedule/WeeklyScheduleView';
import { TaskPriorityPanel } from '@/components/schedule/TaskPriorityPanel';
import { useWeeklySchedule } from '@/hooks/useWeeklySchedule';
import { useTimingBatch } from '@/hooks/useTimingBatch';
import { useSaveTaskOrder, useResetTaskOrder } from '@/hooks/useTaskOrder';
import { useMaintenanceExecutions } from '@/hooks/useMaintenanceExecutions';
import { useQueryClient } from '@tanstack/react-query';
import type { ScheduleConfig, ScheduledTask } from '@/types/schedule';

export default function MaintenanceCalendar() {
  // Deep-link support: read URL params for direct navigation
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view') as ViewMode | null;
  const initialTopLevel = searchParams.get('mode') as TopLevelMode | null;

  // Top-level mode: calendar vs schedule
  const [topLevelMode, setTopLevelMode] = useState<TopLevelMode>(
    initialTopLevel === 'schedule' ? 'schedule' : 'calendar'
  );

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>(initialView === 'day' || initialView === 'week' ? initialView : 'month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Sidebar
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Event detail sheet
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Create action sheet
  const [createActionOpen, setCreateActionOpen] = useState(false);
  const [createActionDate, setCreateActionDate] = useState<Date | null>(null);

  // Schedule view state
  const [scheduleViewMode, setScheduleViewMode] = useState<'gantt' | 'table'>('gantt');
  const [scheduleConfigOpen, setScheduleConfigOpen] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<Partial<ScheduleConfig>>({
    breakDuration: 30,
  });
  const [selectedScheduleTask, setSelectedScheduleTask] = useState<ScheduledTask | null>(null);
  const [taskPriorityOpen, setTaskPriorityOpen] = useState(false);
  const [weeklySelectedDayKey, setWeeklySelectedDayKey] = useState('');

  // Data
  const { eventsByDate, daysWithEvents, isLoading, machines, totalActions, totalMachines, upsertExecution, deleteExecution } =
    useCalendarEvents(currentDate, viewMode);

  const dateKey = getDateKey(currentDate);

  // Weekly schedule (only fetched when top-level mode is 'schedule')
  const { data: weeklySchedule, isLoading: weeklyLoading, error: weeklyError } =
    useWeeklySchedule(topLevelMode === 'schedule', scheduleConfig);

  // Timing batch (for month view overlays)
  const timingRange = useMemo(() => {
    if (topLevelMode !== 'calendar' || viewMode !== 'month') return { from: '', to: '' };
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return {
      from: format(gridStart, 'yyyy-MM-dd'),
      to: format(gridEnd, 'yyyy-MM-dd'),
    };
  }, [currentDate, viewMode, topLevelMode]);

  const { data: timingBatch } = useTimingBatch(
    timingRange.from,
    timingRange.to,
    topLevelMode === 'calendar' && viewMode === 'month',
    scheduleConfig
  );

  // Task order mutations
  const saveTaskOrder = useSaveTaskOrder();
  const resetTaskOrder = useResetTaskOrder();

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

  // Create action for a specific date (from day cell / week column / day view)
  const handleCreateActionForDate = useCallback((date: Date) => {
    setCreateActionDate(date);
    setCreateActionOpen(true);
  }, []);

  // Event click → open detail sheet (calendar events)
  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedScheduleTask(null);
    setSelectedEvent(event);
  }, []);

  // Quick toggle complete from DayView
  const handleToggleComplete = useCallback(
    (event: CalendarEvent) => {
      if (event.execution?.status === 'COMPLETED') {
        deleteExecution.mutate(event.execution.id, {
          onSuccess: () => {
            toast.success('Task marked as pending');
          },
        });
      } else {
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
        queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
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
          queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
          setSelectedScheduleTask(null);
        },
      });
    }
  }, [scheduleDelete, queryClient]);

  // Task order handlers
  const handleSaveTaskOrder = useCallback((overrides: { actionId: number; sortPosition: number }[]) => {
    const activeDateKey = topLevelMode === 'schedule' ? weeklySelectedDayKey : dateKey;
    saveTaskOrder.mutate({ date: activeDateKey, overrides });
  }, [saveTaskOrder, dateKey, topLevelMode, weeklySelectedDayKey]);

  const handleResetTaskOrder = useCallback(() => {
    const activeDateKey = topLevelMode === 'schedule' ? weeklySelectedDayKey : dateKey;
    resetTaskOrder.mutate(activeDateKey);
  }, [resetTaskOrder, dateKey, topLevelMode, weeklySelectedDayKey]);

  // Active schedule for the task priority sheet (from weekly schedule's selected day)
  const prioritySchedule = useMemo(() => {
    if (weeklySchedule?.days?.[weeklySelectedDayKey]) {
      return weeklySchedule.days[weeklySelectedDayKey];
    }
    return null;
  }, [weeklySchedule, weeklySelectedDayKey]);

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
        topLevelMode={topLevelMode}
        onTopLevelModeChange={setTopLevelMode}
        scheduleViewMode={scheduleViewMode}
        onScheduleViewModeChange={setScheduleViewMode}
        onScheduleConfigOpen={() => setScheduleConfigOpen(true)}
        onTaskPriorityOpen={() => setTaskPriorityOpen(true)}
        onCreateAction={() => { setCreateActionDate(null); setCreateActionOpen(true); }}
      />

      <div className="flex flex-1 min-h-0 -mx-4 md:-mx-6 lg:-mx-8">
        {/* Sidebar (only in calendar mode) */}
        {topLevelMode === 'calendar' && (
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
        )}

        {/* Main View */}
        <div className="flex-1 min-w-0 p-4 overflow-y-auto">
          {/* ===== CALENDAR MODE ===== */}
          {topLevelMode === 'calendar' && (
            <>
              {viewMode === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  eventsByDate={filteredEventsByDate}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                  onCreateAction={handleCreateActionForDate}
                  timings={timingBatch?.timings}
                />
              )}
              {viewMode === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  eventsByDate={filteredEventsByDate}
                  onEventClick={handleEventClick}
                  onCreateAction={handleCreateActionForDate}
                />
              )}

              {viewMode === 'day' && (
                <DayView
                  currentDate={currentDate}
                  events={currentDayEvents}
                  onEventClick={handleEventClick}
                  onToggleComplete={handleToggleComplete}
                  onCreateAction={handleCreateActionForDate}
                />
              )}
            </>
          )}

          {/* ===== SCHEDULE MODE (Weekly) ===== */}
          {topLevelMode === 'schedule' && (
            <WeeklyScheduleView
              weeklySchedule={weeklySchedule!}
              isLoading={weeklyLoading}
              error={weeklyError as Error | null}
              scheduleViewMode={scheduleViewMode}
              onTaskClick={handleScheduleTaskClick}
              onSelectedDayChange={setWeeklySelectedDayKey}
            />
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

      {/* Create Action Sheet */}
      <CreateActionSheet
        open={createActionOpen}
        onOpenChange={setCreateActionOpen}
        targetDate={createActionDate}
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

      {/* Task Priority Sheet */}
      {taskPriorityOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setTaskPriorityOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-[380px] max-w-full bg-card border-l border-border z-50 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Task Priority Order</h3>
              <button onClick={() => setTaskPriorityOpen(false)} className="p-1 rounded-md hover:bg-muted transition-colors">
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {prioritySchedule ? (
                <TaskPriorityPanel
                  scheduledTasks={prioritySchedule.shifts.flatMap(s => s.operators.flatMap(o => o.tasks))}
                  unscheduledTasks={prioritySchedule.unscheduled}
                  hasOverrides={!!prioritySchedule.hasOverrides}
                  onSave={handleSaveTaskOrder}
                  onReset={handleResetTaskOrder}
                  isSaving={saveTaskOrder.isPending || resetTaskOrder.isPending}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No schedule loaded. Switch to a schedule view to manage task priority.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
