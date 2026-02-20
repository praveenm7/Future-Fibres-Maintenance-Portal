import { User } from 'lucide-react';
import { formatTimeMinutes } from '@/components/calendar/calendarUtils';
import { ScheduleTaskBlock } from './ScheduleTaskBlock';
import type { OperatorLane, ScheduledTask } from '@/types/schedule';

interface Props {
    lane: OperatorLane;
    workStartMinute: number;
    hourWidth: number;
    totalWidth: number;
    opColWidth: number;
    onTaskClick: (task: ScheduledTask) => void;
}

export function ScheduleOperatorLane({ lane, workStartMinute, hourWidth, totalWidth, opColWidth, onTaskClick }: Props) {
    const utilColor = lane.utilizationPercent >= 80
        ? 'text-red-600 dark:text-red-400'
        : lane.utilizationPercent >= 50
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-emerald-600 dark:text-emerald-400';

    const utilBarColor = lane.utilizationPercent >= 80
        ? 'bg-red-500'
        : lane.utilizationPercent >= 50
            ? 'bg-amber-500'
            : 'bg-emerald-500';

    return (
        <div className="flex border-b border-border last:border-b-0">
            {/* Operator label */}
            <div
                className="flex-shrink-0 border-r border-border px-3 py-2 bg-muted/20 flex flex-col justify-center"
                style={{ width: `${opColWidth}px` }}
            >
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-semibold truncate">{lane.operatorName}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground">
                        {lane.tasks.length} task{lane.tasks.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        {formatTimeMinutes(lane.totalMinutes)}
                    </span>
                    <span className={`text-[11px] font-bold ${utilColor}`}>
                        {lane.utilizationPercent}%
                    </span>
                </div>
                {/* Utilization micro-bar */}
                <div className="mt-1.5 h-[3px] w-full rounded-full bg-muted/40 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${utilBarColor}`}
                        style={{ width: `${Math.min(lane.utilizationPercent, 100)}%` }}
                    />
                </div>
            </div>

            {/* Task blocks */}
            <div className="relative flex-1 min-h-[58px]" style={{ minWidth: `${totalWidth}px` }}>
                {lane.tasks.map(task => (
                    <ScheduleTaskBlock
                        key={task.id}
                        task={task}
                        workStartMinute={workStartMinute}
                        hourWidth={hourWidth}
                        onClick={onTaskClick}
                    />
                ))}
            </div>
        </div>
    );
}
