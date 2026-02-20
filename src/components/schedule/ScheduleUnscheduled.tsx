import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { PERIODICITY_COLORS, type Periodicity } from '@/components/calendar/calendarUtils';
import type { UnscheduledTask } from '@/types/schedule';

interface Props {
    tasks: UnscheduledTask[];
}

export function ScheduleUnscheduled({ tasks }: Props) {
    const [expanded, setExpanded] = useState(true);

    if (tasks.length === 0) return null;

    const mandatoryCount = tasks.filter(t => t.status === 'MANDATORY').length;

    return (
        <div className="bg-card border border-amber-300 dark:border-amber-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            >
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {tasks.length} Unscheduled Task{tasks.length !== 1 ? 's' : ''}
                </span>
                {mandatoryCount > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {mandatoryCount} mandatory
                    </span>
                )}
                <span className="ml-auto">
                    {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </span>
            </button>

            {expanded && (
                <div className="border-t border-amber-200 dark:border-amber-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                                <th className="text-left px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Machine</th>
                                <th className="text-left px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                                <th className="text-left px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                                <th className="text-left px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                                <th className="text-left px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => {
                                const colors = PERIODICITY_COLORS[task.periodicity as Periodicity] || PERIODICITY_COLORS['WEEKLY'];
                                return (
                                    <tr key={`${task.actionId}-unsched`} className="border-t border-amber-100 dark:border-amber-900/50">
                                        <td className="px-3 py-2">
                                            <span className={`text-xs font-semibold ${colors.text}`}>{task.machineFinalCode}</span>
                                        </td>
                                        <td className="px-3 py-2 text-xs max-w-[200px] truncate">{task.actionText}</td>
                                        <td className="px-3 py-2 text-xs">{task.timeNeeded}m</td>
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
                                        <td className="px-3 py-2 text-xs text-muted-foreground italic">{task.reason}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
