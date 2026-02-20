import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Filter,
  ListChecks,
  GanttChart,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ViewMode, getPeriodLabel } from './calendarUtils';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  activeFilterCount: number;
  // Day sub-view controls (optional)
  daySubView?: 'tasks' | 'schedule';
  onDaySubViewChange?: (sub: 'tasks' | 'schedule') => void;
  scheduleViewMode?: 'gantt' | 'table';
  onScheduleViewModeChange?: (mode: 'gantt' | 'table') => void;
  onScheduleConfigOpen?: () => void;
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

export function CalendarHeader({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigate,
  onToggleSidebar,
  sidebarOpen,
  activeFilterCount,
  daySubView,
  onDaySubViewChange,
  scheduleViewMode,
  onScheduleViewModeChange,
  onScheduleConfigOpen,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 relative"
        onClick={onToggleSidebar}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeftOpen className="h-4 w-4" />
        )}
        {!sidebarOpen && activeFilterCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => onNavigate('today')}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Period label */}
      <h2 className="text-base sm:text-lg font-semibold flex-1 min-w-0 truncate">
        {getPeriodLabel(currentDate, viewMode)}
      </h2>

      {/* Filter count (mobile) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
          <Filter className="h-3 w-3" />
          <span>{activeFilterCount}</span>
        </div>
      )}

      {/* Day sub-view: Tasks | Schedule toggle */}
      {onDaySubViewChange && (
        <>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => onDaySubViewChange('tasks')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                daySubView === 'tasks'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <ListChecks className="h-3.5 w-3.5" />
              Tasks
            </button>
            <button
              type="button"
              onClick={() => onDaySubViewChange('schedule')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                daySubView === 'schedule'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <GanttChart className="h-3.5 w-3.5" />
              Schedule
            </button>
          </div>

          {/* Gantt/Table toggle + Settings gear (only when schedule active) */}
          {daySubView === 'schedule' && onScheduleViewModeChange && (
            <>
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => onScheduleViewModeChange('gantt')}
                  className={cn(
                    'px-2.5 py-1.5 text-xs font-medium transition-colors',
                    scheduleViewMode === 'gantt'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  Gantt
                </button>
                <button
                  type="button"
                  onClick={() => onScheduleViewModeChange('table')}
                  className={cn(
                    'px-2.5 py-1.5 text-xs font-medium transition-colors',
                    scheduleViewMode === 'table'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  Table
                </button>
              </div>
              {onScheduleConfigOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onScheduleConfigOpen}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </>
      )}

      {/* View mode toggle */}
      <div className="flex items-center border border-border rounded-lg overflow-hidden">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onViewModeChange(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
