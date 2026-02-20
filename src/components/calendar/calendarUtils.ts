import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday as dateFnsIsToday,
  addMonths,
  addWeeks,
  addDays,
} from 'date-fns';
import { MaintenanceAction, Machine, MaintenanceExecution } from '@/types/maintenance';

// ─── Types ───────────────────────────────────────────────────

export type ViewMode = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  action: MaintenanceAction;
  machine: Machine;
  date: Date;
  dateKey: string;
  execution?: MaintenanceExecution;
}

// ─── Periodicity Colors ──────────────────────────────────────

export const PERIODICITY_COLORS = {
  'BEFORE EACH USE': {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    border: 'border-blue-200 dark:border-blue-700',
    label: 'Before Each Use',
  },
  WEEKLY: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-700',
    label: 'Weekly',
  },
  MONTHLY: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-200 dark:border-amber-700',
    label: 'Monthly',
  },
  QUARTERLY: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    border: 'border-purple-200 dark:border-purple-700',
    label: 'Quarterly',
  },
  YEARLY: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
    border: 'border-red-200 dark:border-red-700',
    label: 'Yearly',
  },
} as const;

export type Periodicity = keyof typeof PERIODICITY_COLORS;

export const ALL_PERIODICITIES: Periodicity[] = [
  'BEFORE EACH USE',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
];

// ─── Workload Intensity ──────────────────────────────────────

export function getWorkloadIntensity(eventCount: number): string {
  if (eventCount === 0) return '';
  if (eventCount <= 3) return 'bg-blue-50/60 dark:bg-blue-950/20';
  if (eventCount <= 6) return 'bg-amber-50/60 dark:bg-amber-950/20';
  return 'bg-red-50/60 dark:bg-red-950/20';
}

export function getWorkloadLabel(eventCount: number): string {
  if (eventCount === 0) return 'No tasks';
  if (eventCount <= 3) return 'Low';
  if (eventCount <= 6) return 'Medium';
  return 'High';
}

// ─── Date Helpers ────────────────────────────────────────────

export function getDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getVisibleDateRange(
  currentDate: Date,
  viewMode: ViewMode
): { start: Date; end: Date } {
  switch (viewMode) {
    case 'month': {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      };
    }
    case 'week': {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    }
    case 'day': {
      return { start: currentDate, end: currentDate };
    }
  }
}

export function getVisibleDays(currentDate: Date, viewMode: ViewMode): Date[] {
  const { start, end } = getVisibleDateRange(currentDate, viewMode);
  return eachDayOfInterval({ start, end });
}

export function navigateDate(
  currentDate: Date,
  viewMode: ViewMode,
  direction: 'prev' | 'next' | 'today'
): Date {
  if (direction === 'today') return new Date();
  const delta = direction === 'next' ? 1 : -1;
  switch (viewMode) {
    case 'month':
      return addMonths(currentDate, delta);
    case 'week':
      return addWeeks(currentDate, delta);
    case 'day':
      return addDays(currentDate, delta);
  }
}

export function getPeriodLabel(currentDate: Date, viewMode: ViewMode): string {
  switch (viewMode) {
    case 'month':
      return format(currentDate, 'MMMM yyyy');
    case 'week': {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd, yyyy')}`;
      }
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    case 'day':
      return format(currentDate, 'EEEE, MMMM d, yyyy');
  }
}

// ─── Time Formatting ─────────────────────────────────────────

export function formatTimeMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

// ─── Month Name Mapping (for yearly actions) ────────────────

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

export function getMonthIndex(monthName: string): number {
  return MONTH_NAMES.indexOf(monthName.toUpperCase());
}

// Re-exports for convenience
export { isSameDay, isSameMonth, dateFnsIsToday as isToday, format };
