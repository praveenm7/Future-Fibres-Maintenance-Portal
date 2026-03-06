import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Filter,
  ListChecks,
  Settings,
  CalendarDays,
  LayoutGrid,
  Info,
  Plus,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ViewMode, getPeriodLabel } from './calendarUtils';

export type TopLevelMode = 'calendar' | 'schedule';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  activeFilterCount: number;
  // Top-level mode
  topLevelMode?: TopLevelMode;
  onTopLevelModeChange?: (mode: TopLevelMode) => void;
  scheduleViewMode?: 'gantt' | 'table';
  onScheduleViewModeChange?: (mode: 'gantt' | 'table') => void;
  onScheduleConfigOpen?: () => void;
  onTaskPriorityOpen?: () => void;
  onCreateAction?: () => void;
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
  topLevelMode = 'calendar',
  onTopLevelModeChange,
  scheduleViewMode,
  onScheduleViewModeChange,
  onScheduleConfigOpen,
  onTaskPriorityOpen,
  onCreateAction,
}: CalendarHeaderProps) {
  const showScheduleControls = topLevelMode === 'schedule';

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

      {/* Top-level mode: Calendar | Schedule */}
      {onTopLevelModeChange && (
        <>
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => onTopLevelModeChange('calendar')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                topLevelMode === 'calendar'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </button>
            <button
              type="button"
              onClick={() => onTopLevelModeChange('schedule')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                topLevelMode === 'schedule'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Schedule
            </button>
          </div>
          <div className="h-6 w-px bg-border" />
        </>
      )}

      {/* Navigation (only in calendar mode) */}
      {topLevelMode === 'calendar' && (
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
      )}

      {/* Period label (calendar mode) */}
      {topLevelMode === 'calendar' && (
        <h2 className="text-base sm:text-lg font-semibold flex-1 min-w-0 truncate">
          {getPeriodLabel(currentDate, viewMode)}
        </h2>
      )}

      {/* Schedule mode: "Weekly Schedule" label + algorithm info */}
      {topLevelMode === 'schedule' && (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold truncate">
            Weekly Schedule
          </h2>
          <ScheduleAlgorithmDialog />
        </div>
      )}

      {/* Filter count (mobile) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
          <Filter className="h-3 w-3" />
          <span>{activeFilterCount}</span>
        </div>
      )}

      {/* Gantt/Table toggle + Settings gear (when in schedule mode) */}
      {showScheduleControls && onScheduleViewModeChange && (
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
          {onTaskPriorityOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onTaskPriorityOpen}
              title="Task Priority Order"
            >
              <ListChecks className="h-4 w-4" />
            </Button>
          )}
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

      {/* Add Action button (calendar mode) */}
      {topLevelMode === 'calendar' && onCreateAction && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5"
          onClick={onCreateAction}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Action</span>
        </Button>
      )}

      {/* View mode toggle (only in calendar mode) */}
      {topLevelMode === 'calendar' && (
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
      )}
    </div>
  );
}

/* ── Scheduling Algorithm Dialog ── */

function FlowArrow() {
  return (
    <div className="flex justify-center py-1">
      <svg width="12" height="16" viewBox="0 0 12 16" className="text-muted-foreground">
        <line x1="6" y1="0" x2="6" y2="10" stroke="currentColor" strokeWidth="2" />
        <polygon points="1,10 6,16 11,10" fill="currentColor" />
      </svg>
    </div>
  );
}

function FlowBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border-2 rounded-lg px-4 py-3 text-center', className)}>
      {children}
    </div>
  );
}

function ScheduleAlgorithmDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted shrink-0"
        title="How scheduling works"
      >
        <Info className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>How Scheduling Works</DialogTitle>
            <DialogDescription className="sr-only">
              Visual flowchart explaining the scheduling algorithm
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-2">
            {/* ── Flowchart ── */}
            <div className="flex flex-col items-center py-4">
              {/* Step 1: Sort */}
              <FlowBox className="border-border bg-muted/30 w-full max-w-sm">
                <p className="text-sm font-bold tracking-wide">SORT TASKS BY PRIORITY</p>
                <p className="text-xs text-muted-foreground mt-0.5">Mandatory before Ideal, then by periodicity weight</p>
              </FlowBox>

              <FlowArrow />

              {/* Step 2: For each task */}
              <FlowBox className="border-border bg-muted/30 w-full max-w-sm">
                <p className="text-sm font-bold tracking-wide">FOR EACH TASK</p>
              </FlowBox>

              <FlowArrow />

              {/* Step 3: Phase 1 - Person in Charge */}
              <FlowBox className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 w-full max-w-sm">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">PHASE 1: PERSON IN CHARGE</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Find the machine's person-in-charge, locate their shift, and try to fit the task in the earliest available slot
                </p>
              </FlowBox>

              {/* Branch: Slot found vs No slot */}
              <div className="flex items-start w-full max-w-sm mt-1">
                {/* Left branch: Slot found */}
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-1">Slot found</p>
                  <FlowArrow />
                  <FlowBox className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">ASSIGN TO PIC</p>
                  </FlowBox>
                </div>

                {/* Right branch: No slot / not working */}
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 py-1">No slot / not working</p>
                  <FlowArrow />
                  <FlowBox className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">PHASE 2: FALLBACK</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Try any free authorized operator across all shifts (least busy first)
                    </p>
                  </FlowBox>

                  {/* Sub-branch: Found vs No slot */}
                  <div className="flex items-start w-full mt-1">
                    <div className="flex-1 flex flex-col items-center">
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 py-1">Found</p>
                      <FlowArrow />
                      <FlowBox className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1.5">
                        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Assign</p>
                      </FlowBox>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <p className="text-[10px] font-semibold text-red-500 py-1">No slot</p>
                      <FlowArrow />
                      <FlowBox className="border-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-1.5">
                        <p className="text-[11px] font-bold text-red-600 dark:text-red-400">Unscheduled</p>
                      </FlowBox>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Detailed Explanations ── */}
            <div className="border-t border-border pt-4 space-y-4 pb-2">
              <div>
                <h4 className="text-sm font-bold text-foreground">PRIORITY ORDER</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Mandatory tasks are scheduled first. Within each priority, tasks are weighted by
                  periodicity: Before Each Use {'>'} Weekly {'>'} Monthly {'>'} Quarterly {'>'} Yearly.
                  Tasks for the same machine are grouped together. Longer tasks are scheduled before shorter ones.
                  Manual drag-and-drop overrides take highest priority.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">PERSON IN CHARGE (PHASE 1)</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Each machine can have a designated person-in-charge. The algorithm always
                  tries to assign tasks to this operator first, within their shift. If they are not
                  working that day or their shift is full, the task falls to Phase 2.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">FALLBACK & LOAD BALANCING (PHASE 2)</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  When the person-in-charge is unavailable, the algorithm searches all shifts for
                  an authorized operator with the earliest available time slot. Authorization groups
                  ensure only qualified operators handle specific machines. A machine can only be
                  worked on by one operator at a time (machine lock).
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">BREAKS & BUFFERS</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Fixed meal breaks at Midnight (01:00), Breakfast (08:00), Lunch (12:00), and Dinner (20:00)
                  with configurable duration. A buffer period between tasks prevents back-to-back scheduling.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t border-border">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
