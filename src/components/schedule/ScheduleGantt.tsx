import { Clock } from 'lucide-react';
import { ScheduleOperatorLane } from './ScheduleOperatorLane';
import type { DailySchedule, ShiftSchedule, ScheduledTask, ScheduleBreak } from '@/types/schedule';

const HOUR_WIDTH = 200; // pixels per hour
const OP_COL_WIDTH = 180; // operator column width

interface Props {
    schedule: DailySchedule;
    onTaskClick: (task: ScheduledTask) => void;
}

function parseTimeToMin(str: string) {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + (m || 0);
}

function formatMinute(m: number) {
    const n = ((m % 1440) + 1440) % 1440;
    const h = Math.floor(n / 60);
    const min = n % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

const BREAK_STRIPE = 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 8px)';

// Shift section colors for the header badges
const SHIFT_COLORS: Record<string, string> = {
    'Morning': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'Day': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'Afternoon': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Night': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

function ShiftGanttSection({
    shift,
    onTaskClick,
}: {
    shift: ShiftSchedule;
    onTaskClick: (task: ScheduledTask) => void;
}) {
    const workStart = parseTimeToMin(shift.workdayStart);
    let workEnd = parseTimeToMin(shift.workdayEnd);
    if (workEnd <= workStart) workEnd += 1440;

    const totalHours = (workEnd - workStart) / 60;
    const totalWidth = totalHours * HOUR_WIDTH;

    // Generate hour marks
    const hours: number[] = [];
    for (let m = workStart; m < workEnd; m += 60) {
        hours.push(m);
    }

    const breaks = shift.breaks || [];

    // "Now" line for this shift
    const now = new Date();
    let nowMinute = now.getHours() * 60 + now.getMinutes();
    if (nowMinute < workStart && workEnd > 1440) nowMinute += 1440;
    const showNowLine = nowMinute >= workStart && nowMinute <= workEnd;
    const nowLeft = ((nowMinute - workStart) / 60) * HOUR_WIDTH;

    const totalTasks = shift.operators.reduce((sum, op) => sum + op.tasks.length, 0);
    const shiftColorClass = SHIFT_COLORS[shift.shiftName] || 'bg-muted text-muted-foreground';

    return (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
            {/* Shift header */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-b border-border">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${shiftColorClass}`}>
                    {shift.shiftName}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                    {shift.workdayStart} – {shift.workdayEnd}
                </span>
                <span className="text-xs text-muted-foreground">
                    {shift.operators.length} operator{shift.operators.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-muted-foreground">
                    {totalTasks} task{totalTasks !== 1 ? 's' : ''}
                </span>
            </div>

            {shift.operators.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No operators assigned to this shift
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="relative" style={{ minWidth: `${totalWidth + OP_COL_WIDTH}px` }}>
                        {/* Time axis header */}
                        <div className="flex border-b-2 border-border">
                            <div
                                className="flex-shrink-0 border-r border-border px-4 py-2 bg-muted/30 flex items-end"
                                style={{ width: `${OP_COL_WIDTH}px` }}
                            >
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Operator</span>
                            </div>
                            <div className="relative flex-1" style={{ minWidth: `${totalWidth}px` }}>
                                {/* Break zones in header */}
                                {breaks.map(brk => (
                                    <div
                                        key={brk.label}
                                        className="absolute top-0 bottom-0 bg-amber-100/50 dark:bg-amber-900/15"
                                        style={{
                                            left: `${((brk.startMinute - workStart) / 60) * HOUR_WIDTH}px`,
                                            width: `${((brk.endMinute - brk.startMinute) / 60) * HOUR_WIDTH}px`,
                                            backgroundImage: BREAK_STRIPE,
                                        }}
                                    >
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-widest text-amber-600/60 dark:text-amber-400/50">
                                            {brk.label}
                                        </span>
                                    </div>
                                ))}
                                {/* Hour + half-hour labels */}
                                <div className="flex">
                                    {hours.map(m => {
                                        const label = formatMinute(m);
                                        const halfLabel = formatMinute(m + 30);
                                        return (
                                            <div
                                                key={m}
                                                className="flex-shrink-0 border-r border-border relative"
                                                style={{ width: `${HOUR_WIDTH}px` }}
                                            >
                                                <div className="px-2 py-2">
                                                    <span className="text-xs font-mono font-medium text-foreground/70">{label}</span>
                                                </div>
                                                <div
                                                    className="absolute top-0 bottom-0 border-l border-dashed border-border/50"
                                                    style={{ left: `${HOUR_WIDTH / 2}px` }}
                                                >
                                                    <div className="px-1.5 py-2">
                                                        <span className="text-[10px] font-mono text-muted-foreground/50">{halfLabel}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Operator lanes */}
                        {shift.operators.map((lane, idx) => (
                            <div
                                key={lane.operatorId}
                                className={`relative ${idx % 2 === 1 ? 'bg-muted/5' : ''}`}
                            >
                                {/* Background: break zones + grid lines */}
                                <div className="flex">
                                    <div className="flex-shrink-0" style={{ width: `${OP_COL_WIDTH}px` }} />
                                    <div className="relative flex-1" style={{ minWidth: `${totalWidth}px` }}>
                                        {breaks.map(brk => (
                                            <div
                                                key={brk.label}
                                                className="absolute top-0 bottom-0 bg-amber-50/40 dark:bg-amber-950/15"
                                                style={{
                                                    left: `${((brk.startMinute - workStart) / 60) * HOUR_WIDTH}px`,
                                                    width: `${((brk.endMinute - brk.startMinute) / 60) * HOUR_WIDTH}px`,
                                                    backgroundImage: BREAK_STRIPE,
                                                }}
                                            />
                                        ))}
                                        {hours.map(m => (
                                            <div key={m}>
                                                <div
                                                    className="absolute top-0 bottom-0 border-l border-border/30"
                                                    style={{ left: `${((m - workStart) / 60) * HOUR_WIDTH}px` }}
                                                />
                                                <div
                                                    className="absolute top-0 bottom-0 border-l border-dashed border-border/20"
                                                    style={{ left: `${((m - workStart) / 60) * HOUR_WIDTH + HOUR_WIDTH / 2}px` }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Lane content */}
                                <div className="absolute inset-0">
                                    <ScheduleOperatorLane
                                        lane={lane}
                                        workStartMinute={workStart}
                                        hourWidth={HOUR_WIDTH}
                                        totalWidth={totalWidth}
                                        opColWidth={OP_COL_WIDTH}
                                        onTaskClick={onTaskClick}
                                    />
                                </div>
                                <div className="h-[64px]" />
                            </div>
                        ))}

                        {/* Now line */}
                        {showNowLine && (
                            <div
                                className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20 pointer-events-none"
                                style={{ left: `${nowLeft + OP_COL_WIDTH}px` }}
                            >
                                <div className="absolute -top-0.5 -translate-x-1/2 left-1/2 bg-red-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-b-md whitespace-nowrap">
                                    {formatMinute(nowMinute)}
                                </div>
                                <div className="absolute top-5 -left-[5px] w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-card" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ScheduleGantt({ schedule, onTaskClick }: Props) {
    const hasShifts = schedule.shifts.length > 0;
    const hasOperators = schedule.shifts.some(s => s.operators.length > 0);

    if (!hasShifts) {
        return (
            <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No shifts configured</p>
                <p className="text-xs mt-1">Assign operators to shifts in the settings panel to generate a schedule.</p>
            </div>
        );
    }

    if (!hasOperators) {
        return (
            <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
                <p className="text-sm">No operators assigned to any shift for this day</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {schedule.shifts.map(shift => (
                <ShiftGanttSection
                    key={shift.shiftId}
                    shift={shift}
                    onTaskClick={onTaskClick}
                />
            ))}
        </div>
    );
}
