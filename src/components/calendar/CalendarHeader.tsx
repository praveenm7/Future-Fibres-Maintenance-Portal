import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Filter,
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
