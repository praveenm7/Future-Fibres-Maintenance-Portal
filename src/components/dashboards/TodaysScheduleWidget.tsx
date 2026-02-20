import { useNavigate } from 'react-router-dom';
import { CalendarClock, Users, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useDailySchedule } from '@/hooks/useDailySchedule';
import { PERIODICITY_COLORS, formatTimeMinutes, getDateKey, type Periodicity } from '@/components/calendar/calendarUtils';
import type { ScheduledTask } from '@/types/schedule';

export function TodaysScheduleWidget() {
    const navigate = useNavigate();
    const today = getDateKey(new Date());
    const { data: schedule, isLoading } = useDailySchedule(today);

    const handleViewSchedule = () => {
        navigate(`/maintenance-calendar?view=day&subView=schedule`);
    };

    // Gather all tasks across all shifts
    const allTasks: ScheduledTask[] = schedule
        ? schedule.shifts.flatMap(s => s.operators.flatMap(op => op.tasks))
        : [];

    // Upcoming pending tasks, sorted by start time
    const pendingTasks = allTasks
        .filter(t => t.executionStatus !== 'COMPLETED' && t.executionStatus !== 'SKIPPED')
        .sort((a, b) => a.startMinute - b.startMinute)
        .slice(0, 5);

    // Stats
    const totalTasks = schedule?.summary.totalTasks ?? 0;
    const scheduledCount = schedule?.summary.scheduledTasks ?? 0;
    const unscheduledCount = schedule?.summary.unscheduledTasks ?? 0;
    const completedCount = allTasks.filter(t => t.executionStatus === 'COMPLETED').length;

    const avgUtilization = schedule && schedule.shifts.length > 0
        ? Math.round(
            schedule.shifts
                .flatMap(s => s.operators)
                .reduce((sum, op) => sum + op.utilizationPercent, 0) /
            Math.max(schedule.shifts.flatMap(s => s.operators).length, 1)
        )
        : 0;

    if (isLoading) {
        return (
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                </div>
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                    ))}
                </div>
            </div>
        );
    }

    const hasSchedule = schedule && schedule.shifts.length > 0 && schedule.shifts.some(s => s.operators.length > 0);

    return (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">Today's Schedule</h3>
                    <span className="text-xs text-muted-foreground font-mono">{today}</span>
                </div>
                <button
                    onClick={handleViewSchedule}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                    View Full Schedule
                    <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>

            {!hasSchedule ? (
                <div className="px-5 py-8 text-center text-muted-foreground">
                    <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No schedule generated for today</p>
                    <p className="text-xs mt-1">Assign operators to shifts to generate a daily schedule.</p>
                </div>
            ) : (
                <div className="p-5">
                    {/* Mini KPI stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                        <MiniStat label="Total Tasks" value={totalTasks} icon={CalendarClock} color="text-primary" />
                        <MiniStat label="Scheduled" value={scheduledCount} icon={CheckCircle2} color="text-emerald-600" />
                        <MiniStat label="Completed" value={`${completedCount}/${scheduledCount}`} icon={CheckCircle2} color="text-emerald-600" />
                        <MiniStat label="Unscheduled" value={unscheduledCount} icon={AlertCircle} color={unscheduledCount > 0 ? 'text-destructive' : 'text-muted-foreground'} />
                        <MiniStat label="Avg Utilization" value={`${avgUtilization}%`} icon={Users} color={avgUtilization >= 80 ? 'text-destructive' : avgUtilization >= 50 ? 'text-warning' : 'text-emerald-600'} />
                    </div>

                    {/* Upcoming tasks list */}
                    {pendingTasks.length > 0 && (
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                Upcoming Tasks
                            </div>
                            <div className="space-y-1">
                                {pendingTasks.map(task => {
                                    const colors = PERIODICITY_COLORS[task.periodicity as Periodicity] || PERIODICITY_COLORS['WEEKLY'];
                                    return (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 px-3 py-1.5 rounded hover:bg-muted/30 transition-colors"
                                        >
                                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                                            <span className="text-xs font-mono text-muted-foreground w-14 flex-shrink-0">
                                                {task.startTime}
                                            </span>
                                            <span className="text-xs font-bold truncate min-w-0 flex-1">
                                                {task.machineFinalCode}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden md:inline">
                                                {task.actionText}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                                {formatTimeMinutes(task.timeNeeded)}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[120px] flex-shrink-0 hidden lg:inline">
                                                {task.assignedOperatorName}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {allTasks.filter(t => t.executionStatus !== 'COMPLETED' && t.executionStatus !== 'SKIPPED').length > 5 && (
                                <button
                                    onClick={handleViewSchedule}
                                    className="text-xs text-primary hover:text-primary/80 mt-2 cursor-pointer"
                                >
                                    + {allTasks.filter(t => t.executionStatus !== 'COMPLETED' && t.executionStatus !== 'SKIPPED').length - 5} more tasks
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MiniStat({ label, value, icon: Icon, color }: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}) {
    return (
        <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-muted/20 border border-border/50">
            <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
            <div className="min-w-0">
                <div className={`text-lg font-bold leading-tight ${color}`}>{value}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium truncate">{label}</div>
            </div>
        </div>
    );
}
