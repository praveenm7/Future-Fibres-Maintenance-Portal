import { memo, useMemo } from 'react';
import { Plus, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CalendarEvent,
  getDateKey,
  formatTimeMinutes,
  isToday,
  isSameMonth,
  PERIODICITY_COLORS,
  type Periodicity,
} from './calendarUtils';
import type { TaskTiming } from '@/types/schedule';

interface DayCellProps {
  date: Date;
  events: CalendarEvent[];
  currentMonth: Date;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreateAction?: (date: Date) => void;
  timings?: Record<string, TaskTiming>;
}

export const DayCell = memo(function DayCell({
  date,
  events,
  currentMonth,
  onDateClick,
  onCreateAction,
}: DayCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  const totalCount = events.length;
  const completedCount = events.filter(e => e.execution?.status === 'COMPLETED').length;
  const skippedCount = events.filter(e => e.execution?.status === 'SKIPPED').length;
  const mandatoryCount = events.filter(e => e.action.status === 'MANDATORY' && e.execution?.status !== 'COMPLETED').length;
  const totalTime = events.reduce((sum, e) => sum + e.action.timeNeeded, 0);
  const pendingCount = totalCount - completedCount - skippedCount;

  // Group events by periodicity for the dot summary
  const periodicityGroups = useMemo(() => {
    if (totalCount === 0) return [];
    const map = new Map<string, number>();
    for (const e of events) {
      const p = e.action.periodicity;
      map.set(p, (map.get(p) || 0) + 1);
    }
    return Array.from(map.entries()).map(([periodicity, count]) => ({
      periodicity: periodicity as Periodicity,
      count,
      color: PERIODICITY_COLORS[periodicity as Periodicity]?.dot || 'bg-gray-400',
      label: PERIODICITY_COLORS[periodicity as Periodicity]?.label || periodicity,
    }));
  }, [events, totalCount]);

  // Workload level for subtle left accent
  const workloadAccent = totalCount === 0
    ? ''
    : totalCount <= 3
      ? 'border-l-2 border-l-blue-300 dark:border-l-blue-700'
      : totalCount <= 6
        ? 'border-l-2 border-l-amber-400 dark:border-l-amber-600'
        : 'border-l-2 border-l-red-400 dark:border-l-red-600';

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => onDateClick(date)}
      className={cn(
        'group/cell relative min-h-[80px] lg:min-h-[96px] border-b border-r border-border p-1.5 text-left w-full',
        'transition-all duration-200',
        'hover:bg-muted/50 hover:shadow-md hover:z-10 hover:scale-[1.02] hover:border-primary/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        workloadAccent,
        !isCurrentMonth && 'opacity-35'
      )}
    >
      {/* Day number + add button */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'h-6 w-6 rounded-full text-xs font-medium flex items-center justify-center transition-transform duration-200',
            'group-hover/cell:scale-110',
            today
              ? 'bg-primary text-primary-foreground font-bold'
              : 'text-foreground'
          )}
        >
          {date.getDate()}
        </span>
        <div className="flex items-center gap-1">
          {totalCount > 0 && (
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200" />
              {formatTimeMinutes(totalTime)}
            </span>
          )}
          {onCreateAction && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onCreateAction(date); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onCreateAction(date); } }}
              className={cn(
                'h-5 w-5 rounded-full flex items-center justify-center transition-all duration-200',
                'opacity-0 scale-75 group-hover/cell:opacity-100 group-hover/cell:scale-100',
                'text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground',
                'shadow-sm hover:shadow'
              )}
              title="Add action"
            >
              <Plus className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      {totalCount > 0 && (
        <div className="space-y-1.5">
          {/* Compact summary — always visible */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">
              {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
            </span>
            {mandatoryCount > 0 && (
              <span className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40 px-1 py-0 rounded">
                {mandatoryCount} req
              </span>
            )}
          </div>

          {/* Periodicity dots — always visible */}
          <div className="flex items-center gap-1 flex-wrap">
            {periodicityGroups.map(({ periodicity, count, color }) => (
              <div
                key={periodicity}
                className="flex items-center gap-0.5"
                title={`${count} ${PERIODICITY_COLORS[periodicity]?.label}`}
              >
                <div className={cn('h-2 w-2 rounded-full', color)} />
                <span className="text-[9px] text-muted-foreground font-medium">{count}</span>
              </div>
            ))}
          </div>

          {/* Expanded details — revealed on hover */}
          <div className="overflow-hidden transition-all duration-300 max-h-0 group-hover/cell:max-h-24 opacity-0 group-hover/cell:opacity-100">
            {/* Status breakdown */}
            <div className="flex items-center gap-2 text-[9px] py-0.5">
              {completedCount > 0 && (
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {completedCount} done
                </span>
              )}
              {pendingCount > 0 && (
                <span className="text-muted-foreground">
                  {pendingCount} pending
                </span>
              )}
              {mandatoryCount > 0 && (
                <span className="flex items-center gap-0.5 text-red-500">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {mandatoryCount}
                </span>
              )}
            </div>

            {/* Periodicity labels on hover */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {periodicityGroups.map(({ periodicity, count, color, label }) => (
                <span
                  key={periodicity}
                  className={cn(
                    'inline-flex items-center gap-0.5 text-[8px] font-medium px-1 py-0 rounded',
                    PERIODICITY_COLORS[periodicity]?.bg,
                    PERIODICITY_COLORS[periodicity]?.text,
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', color)} />
                  {count} {label}
                </span>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          {completedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progressPercent === 100
                      ? 'bg-emerald-500'
                      : 'bg-primary/60'
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className={cn(
                'text-[9px] font-medium',
                progressPercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              )}>
                {completedCount}/{totalCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Empty state on hover — subtle prompt */}
      {totalCount === 0 && onCreateAction && (
        <div className="flex items-center justify-center h-8 opacity-0 group-hover/cell:opacity-60 transition-opacity duration-200">
          <span className="text-[9px] text-muted-foreground">Click + to add</span>
        </div>
      )}
    </button>
  );
});
