import { useMemo } from 'react';
import {
  eachDayOfInterval,
  startOfMonth,
  startOfYear,
  differenceInDays,
} from 'date-fns';
import { useMachines } from '@/hooks/useMachines';
import { useMaintenanceActions } from '@/hooks/useMaintenanceActions';
import { useMaintenanceExecutions } from '@/hooks/useMaintenanceExecutions';
import { MaintenanceAction, Machine, MaintenanceExecution } from '@/types/maintenance';
import {
  CalendarEvent,
  ViewMode,
  getVisibleDateRange,
  getDateKey,
  getMonthIndex,
} from './calendarUtils';

function generateOccurrences(
  action: MaintenanceAction,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const dates: Date[] = [];

  switch (action.periodicity) {
    case 'BEFORE EACH USE': {
      return eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    }

    case 'WEEKLY': {
      // Use a stable anchor: the start of the year, then step by 7 days
      const anchor = startOfYear(rangeStart);
      const daysDiff = differenceInDays(rangeStart, anchor);
      const offsetToNextOccurrence = (7 - (daysDiff % 7)) % 7;
      let current = new Date(rangeStart);
      current.setDate(current.getDate() + offsetToNextOccurrence);
      while (current <= rangeEnd) {
        dates.push(new Date(current));
        current = new Date(current);
        current.setDate(current.getDate() + 7);
      }
      return dates;
    }

    case 'MONTHLY': {
      // First day of each month in range
      let current = startOfMonth(rangeStart);
      if (current < rangeStart) {
        current = new Date(current);
        current.setMonth(current.getMonth() + 1);
        current = startOfMonth(current);
      }
      while (current <= rangeEnd) {
        dates.push(new Date(current));
        current = new Date(current);
        current.setMonth(current.getMonth() + 1);
        current = startOfMonth(current);
      }
      return dates;
    }

    case 'QUARTERLY': {
      // Quarter start months: Jan(0), Apr(3), Jul(6), Oct(9)
      const quarterMonths = [0, 3, 6, 9];
      let year = rangeStart.getFullYear();
      const endYear = rangeEnd.getFullYear();
      while (year <= endYear) {
        for (const m of quarterMonths) {
          const date = new Date(year, m, 1);
          if (date >= rangeStart && date <= rangeEnd) {
            dates.push(date);
          }
        }
        year++;
      }
      return dates;
    }

    case 'YEARLY': {
      // Respect the action.month field if present
      const targetMonth = action.month
        ? getMonthIndex(action.month)
        : 0; // Default to January

      if (targetMonth === -1) return dates;

      let year = rangeStart.getFullYear();
      const endYear = rangeEnd.getFullYear();
      while (year <= endYear) {
        const date = new Date(year, targetMonth, 1);
        if (date >= rangeStart && date <= rangeEnd) {
          dates.push(date);
        }
        year++;
      }
      return dates;
    }

    default:
      return dates;
  }
}

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  eventsByDate: Record<string, CalendarEvent[]>;
  daysWithEvents: Date[];
  isLoading: boolean;
  machines: Machine[];
  totalActions: number;
  totalMachines: number;
  upsertExecution: ReturnType<ReturnType<typeof useMaintenanceExecutions>['useUpsertExecution']>;
  deleteExecution: ReturnType<ReturnType<typeof useMaintenanceExecutions>['useDeleteExecution']>;
}

export function useCalendarEvents(
  currentDate: Date,
  viewMode: ViewMode
): UseCalendarEventsReturn {
  const { useGetMachines } = useMachines();
  const { useGetActions } = useMaintenanceActions();
  const { useGetExecutions, useUpsertExecution, useDeleteExecution } = useMaintenanceExecutions();

  const { data: machines = [], isLoading: loadingMachines } = useGetMachines();
  const { data: allActions = [], isLoading: loadingActions } = useGetActions();

  const { start, end } = useMemo(
    () => getVisibleDateRange(currentDate, viewMode),
    [currentDate, viewMode]
  );

  const fromKey = getDateKey(start);
  const toKey = getDateKey(end);

  const { data: executions = [], isLoading: loadingExecutions } = useGetExecutions(fromKey, toKey);
  const upsertExecution = useUpsertExecution();
  const deleteExecution = useDeleteExecution();

  // Build execution lookup: "actionId-dateKey" → execution
  const executionMap = useMemo(() => {
    const map = new Map<string, MaintenanceExecution>();
    for (const exec of executions) {
      // scheduledDate comes back as ISO string, extract the date part
      const dateKey = exec.scheduledDate.substring(0, 10);
      map.set(`${exec.actionId}-${dateKey}`, exec);
    }
    return map;
  }, [executions]);

  const events = useMemo(() => {
    if (!machines.length || !allActions.length) return [];

    const machineMap = new Map<string, Machine>();
    for (const m of machines) {
      machineMap.set(m.id, m);
    }

    const result: CalendarEvent[] = [];

    for (const action of allActions) {
      const machine = machineMap.get(action.machineId);
      if (!machine) continue;

      const occurrences = generateOccurrences(action, start, end);
      for (const date of occurrences) {
        const dateKey = getDateKey(date);
        const eventId = `${action.id}-${dateKey}`;
        result.push({
          id: eventId,
          action,
          machine,
          date,
          dateKey,
          execution: executionMap.get(eventId),
        });
      }
    }

    return result;
  }, [machines, allActions, start, end, executionMap]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      if (!map[event.dateKey]) map[event.dateKey] = [];
      map[event.dateKey].push(event);
    }
    return map;
  }, [events]);

  const daysWithEvents = useMemo(() => {
    return Object.keys(eventsByDate).map((d) => new Date(d + 'T00:00:00'));
  }, [eventsByDate]);

  return {
    events,
    eventsByDate,
    daysWithEvents,
    isLoading: loadingMachines || loadingActions || loadingExecutions,
    machines,
    totalActions: allActions.length,
    totalMachines: machines.length,
    upsertExecution,
    deleteExecution,
  };
}
