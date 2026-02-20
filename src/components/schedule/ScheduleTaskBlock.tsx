import { Check, Minus, Clock, AlertCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip';
import { PERIODICITY_COLORS, formatTimeMinutes, type Periodicity } from '@/components/calendar/calendarUtils';
import type { ScheduledTask } from '@/types/schedule';

interface Props {
    task: ScheduledTask;
    workStartMinute: number;
    hourWidth: number;
    onClick: (task: ScheduledTask) => void;
}

export function ScheduleTaskBlock({ task, workStartMinute, hourWidth, onClick }: Props) {
    const left = ((task.startMinute - workStartMinute) / 60) * hourWidth;
    const width = ((task.endMinute - task.startMinute) / 60) * hourWidth;
    const colors = PERIODICITY_COLORS[task.periodicity as Periodicity] || PERIODICITY_COLORS['WEEKLY'];

    const isCompleted = task.executionStatus === 'COMPLETED';
    const isSkipped = task.executionStatus === 'SKIPPED';
    const isMandatory = task.status === 'MANDATORY';

    // Three-tier content based on rendered width
    const renderContent = () => {
        if (width < 30) {
            // Tier 1: Just status indicator
            return (
                <div className="relative flex items-center justify-center w-full">
                    {isCompleted && <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />}
                    {isSkipped && <Minus className="h-3 w-3 text-muted-foreground" />}
                    {!isCompleted && !isSkipped && (
                        <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                    )}
                </div>
            );
        }

        if (width <= 90) {
            // Tier 2: Machine code only
            return (
                <div className="relative flex items-center gap-1 min-w-0">
                    {isCompleted && <Check className="h-3 w-3 text-emerald-600 flex-shrink-0" strokeWidth={3} />}
                    {isSkipped && <Minus className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                    <span className={`text-[11px] font-bold truncate ${colors.text}`}>
                        {task.machineFinalCode}
                    </span>
                </div>
            );
        }

        // Tier 3: Full content — machine code + action + time
        return (
            <div className="relative flex items-center gap-1.5 min-w-0">
                {isCompleted && <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" strokeWidth={3} />}
                {isSkipped && <Minus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold leading-tight truncate ${colors.text}`}>
                            {task.machineFinalCode}
                        </span>
                        <span className={`text-[10px] leading-tight ${colors.text} opacity-60`}>
                            {formatTimeMinutes(task.timeNeeded)}
                        </span>
                    </div>
                    <div className={`text-[10px] leading-tight truncate ${colors.text} opacity-75`}>
                        {task.actionText}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
                <button
                    onClick={() => onClick(task)}
                    className={`absolute top-1.5 bottom-1.5 rounded-md border overflow-hidden flex items-center px-1.5 text-left transition-all hover:shadow-lg hover:z-20 hover:brightness-[0.97] cursor-pointer ${colors.border} ${isSkipped ? 'opacity-50' : ''} ${isMandatory ? 'border-l-[4px] border-l-red-500' : ''}`}
                    style={{ left: `${left}px`, width: `${Math.max(width, 20)}px` }}
                >
                    {/* Background */}
                    <div className={`absolute inset-0 ${colors.bg} ${task.status === 'IDEAL' ? 'opacity-70' : ''}`} />

                    {/* Completed overlay */}
                    {isCompleted && (
                        <div className="absolute inset-0 bg-emerald-500/15" />
                    )}

                    {/* Content */}
                    <div className="relative min-w-0 w-full">
                        {renderContent()}
                    </div>
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[280px] p-0">
                <div className="px-3 py-2 space-y-1.5">
                    {/* Machine + Action */}
                    <div>
                        <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                            <span className="text-sm font-bold">{task.machineFinalCode}</span>
                            {isMandatory && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-2.5 w-2.5" />
                                    MANDATORY
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{task.actionText}</p>
                    </div>

                    {/* Time + Duration */}
                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {task.startTime} – {task.endTime}
                        </span>
                        <span className="text-muted-foreground">
                            {formatTimeMinutes(task.timeNeeded)}
                        </span>
                    </div>

                    {/* Status + Periodicity */}
                    <div className="flex items-center gap-2 text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                            {(PERIODICITY_COLORS[task.periodicity as Periodicity] || PERIODICITY_COLORS['WEEKLY']).label}
                        </span>
                        {isCompleted && (
                            <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                                <Check className="h-3 w-3" strokeWidth={3} /> Done
                            </span>
                        )}
                        {isSkipped && (
                            <span className="text-muted-foreground">Skipped</span>
                        )}
                        {!isCompleted && !isSkipped && (
                            <span className="text-muted-foreground">Pending</span>
                        )}
                    </div>

                    {/* Operator */}
                    <div className="text-[11px] text-muted-foreground">
                        Assigned to <span className="font-medium text-foreground">{task.assignedOperatorName}</span>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
