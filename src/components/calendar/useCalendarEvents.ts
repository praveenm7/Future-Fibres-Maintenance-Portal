import { useMemo } from 'react';
import {
  eachDayOfInterval,
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

// Universal epoch for stable multi-interval alignment (2020-01-06 = Monday)
const EPOCH = new Date(2020, 0, 6);
const EPOCH_TS = EPOCH.getTime();
const MS_PER_DAY = 86400000;

/** Get day-of-week: 0=Mon..6=Sun */
function getDayOfWeekMon(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Compute the nth weekday of a given month/year. */
function nthWeekday(year: number, month: number, n: number, dow: number): Date | null {
  const jsDow = (dow + 1) % 7;
  const first = new Date(year, month, 1);
  const firstDow = first.getDay();
  const dayOffset = (jsDow - firstDow + 7) % 7;
  const day = 1 + dayOffset + (n - 1) * 7;
  const result = new Date(year, month, day);
  if (result.getMonth() !== month) return null;
  return result;
}

/** Create a safe day-of-month date, capping at 28. */
function safeDayOfMonth(year: number, month: number, day: number): Date {
  return new Date(year, month, Math.min(day, 28));
}

function generateOccurrences(
  action: MaintenanceAction,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const dates: Date[] = [];
  const interval = action.intervalMultiplier ?? 1;

  switch (action.periodicity) {
    case 'BEFORE EACH USE': {
      return eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    }

    case 'DAILY': {
      const daysSinceEpoch = Math.floor((rangeStart.getTime() - EPOCH_TS) / MS_PER_DAY);
      const remainder = ((daysSinceEpoch % interval) + interval) % interval;
      const offset = remainder === 0 ? 0 : interval - remainder;
      let current = new Date(rangeStart);
      current.setDate(current.getDate() + offset);
      while (current <= rangeEnd) {
        dates.push(new Date(current));
        current = new Date(current);
        current.setDate(current.getDate() + interval);
      }
      return dates;
    }

    case 'WEEKLY': {
      const targetDow = action.dayOfWeek ?? 0;
      const startDow = getDayOfWeekMon(rangeStart);
      const daysToTarget = (targetDow - startDow + 7) % 7;
      let current = new Date(rangeStart);
      current.setDate(current.getDate() + daysToTarget);

      if (interval > 1) {
        const weeksSinceEpoch = Math.floor((current.getTime() - EPOCH_TS) / (MS_PER_DAY * 7));
        const weekRemainder = ((weeksSinceEpoch % interval) + interval) % interval;
        if (weekRemainder !== 0) {
          current.setDate(current.getDate() + (interval - weekRemainder) * 7);
        }
      }

      while (current <= rangeEnd) {
        if (current >= rangeStart) {
          dates.push(new Date(current));
        }
        current = new Date(current);
        current.setDate(current.getDate() + interval * 7);
      }
      return dates;
    }

    case 'MONTHLY': {
      const hasDayOfMonth = action.dayOfMonth != null;
      const hasWeekOfMonth = action.weekOfMonth != null;
      const dow = action.dayOfWeek ?? 0;

      const epochMonth = EPOCH.getFullYear() * 12 + EPOCH.getMonth();
      const startMonth = rangeStart.getFullYear() * 12 + rangeStart.getMonth();
      const endMonth = rangeEnd.getFullYear() * 12 + rangeEnd.getMonth();

      let monthOffset = startMonth - epochMonth;
      const remainder = ((monthOffset % interval) + interval) % interval;
      let m = remainder === 0 ? startMonth : startMonth + (interval - remainder);

      while (m <= endMonth) {
        const year = Math.floor(m / 12);
        const month = m % 12;
        let date: Date | null;

        if (hasDayOfMonth) {
          date = safeDayOfMonth(year, month, action.dayOfMonth!);
        } else if (hasWeekOfMonth) {
          date = nthWeekday(year, month, action.weekOfMonth!, dow);
        } else {
          date = new Date(year, month, 1);
        }

        if (date && date >= rangeStart && date <= rangeEnd) {
          dates.push(date);
        }
        m += interval;
      }
      return dates;
    }

    case 'QUARTERLY': {
      const quarterMonthOffset = (action.quarterMonth ?? 1) - 1;
      const dayOfMonth = action.dayOfMonth ?? 1;

      const epochQuarter = Math.floor(EPOCH.getMonth() / 3) + EPOCH.getFullYear() * 4;
      const startQuarter = Math.floor(rangeStart.getMonth() / 3) + rangeStart.getFullYear() * 4;
      const endQuarter = Math.floor(rangeEnd.getMonth() / 3) + rangeEnd.getFullYear() * 4;

      let qOffset = startQuarter - epochQuarter;
      const remainder = ((qOffset % interval) + interval) % interval;
      let q = remainder === 0 ? startQuarter : startQuarter + (interval - remainder);

      while (q <= endQuarter) {
        const year = Math.floor(q / 4);
        const quarterBase = (q % 4) * 3;
        const targetMonth = quarterBase + quarterMonthOffset;

        if (targetMonth <= 11) {
          const date = safeDayOfMonth(year, targetMonth, dayOfMonth);
          if (date >= rangeStart && date <= rangeEnd) {
            dates.push(date);
          }
        }
        q += interval;
      }
      return dates;
    }

    case 'YEARLY': {
      const targetMonth = action.month ? getMonthIndex(action.month) : 0;
      if (targetMonth === -1) return dates;
      const dayOfMonth = action.dayOfMonth ?? 1;

      let year = rangeStart.getFullYear();
      const endYear = rangeEnd.getFullYear();

      const epochYear = EPOCH.getFullYear();
      let yearOffset = year - epochYear;
      const remainder = ((yearOffset % interval) + interval) % interval;
      if (remainder !== 0) {
        year += interval - remainder;
      }

      while (year <= endYear) {
        const date = safeDayOfMonth(year, targetMonth, dayOfMonth);
        if (date >= rangeStart && date <= rangeEnd) {
          dates.push(date);
        }
        year += interval;
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
