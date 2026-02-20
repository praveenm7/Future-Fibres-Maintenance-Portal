import { Check, Minus, AlertCircle } from 'lucide-react';
import { PERIODICITY_COLORS, type Periodicity } from '@/components/calendar/calendarUtils';
import type { DailySchedule, ScheduledTask } from '@/types/schedule';

interface Props {
    schedule: DailySchedule;
    onTaskClick: (task: ScheduledTask) => void;
}

export function ScheduleTable({ schedule, onTaskClick }: Props) {
    // Flatten tasks from all shifts → all operators → all tasks
    const allTasks = schedule.shifts.flatMap(shift =>
        shift.operators.flatMap(lane =>
            lane.tasks.map(task => ({
                ...task,
                operatorName: lane.operatorName,
                shiftName: shift.shiftName,
            }))
        )
    ).sort((a, b) => a.startMinute - b.startMinute);

    if (allTasks.length === 0) {
        return (
            <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
                <p className="text-sm">No tasks scheduled for this day</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
                            <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shift</th>
                            <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Operator</th>
                            <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Machine</th>
                            <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                            <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                            <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                            <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allTasks.map(task => {
                            const colors = PERIODICITY_COLORS[task.periodicity as Periodicity] || PERIODICITY_COLORS['WEEKLY'];
                            const isCompleted = task.executionStatus === 'COMPLETED';
                            const isSkipped = task.executionStatus === 'SKIPPED';

                            return (
                                <tr
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    className="border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
                                >
                                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                                        {task.startTime} – {task.endTime}
                                    </td>
                                    <td className="px-3 py-2 text-[10px] text-muted-foreground">{task.shiftName}</td>
                                    <td className="px-3 py-2 text-xs">{task.operatorName}</td>
                                    <td className="px-3 py-2">
                                        <span className={`text-xs font-semibold ${colors.text}`}>{task.machineFinalCode}</span>
                                    </td>
                                    <td className="px-3 py-2 text-xs max-w-[200px] truncate">{task.actionText}</td>
                                    <td className="px-3 py-2 text-xs whitespace-nowrap">{task.timeNeeded}m</td>
                                    <td className="px-3 py-2">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                            task.status === 'MANDATORY'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        }`}>
                                            {task.status === 'MANDATORY' && <AlertCircle className="h-2.5 w-2.5" />}
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        {isCompleted && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                                                <Check className="h-3 w-3" strokeWidth={3} /> Done
                                            </span>
                                        )}
                                        {isSkipped && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                                <Minus className="h-3 w-3" /> Skipped
                                            </span>
                                        )}
                                        {!isCompleted && !isSkipped && (
                                            <span className="text-[10px] text-muted-foreground">Pending</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
