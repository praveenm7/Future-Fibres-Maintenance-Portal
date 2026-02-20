import { X, User, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { ScheduleConfig, Shift, OperatorRosterEntry } from '@/types/schedule';
import { useShifts, useShiftRoster, useSetDefaultShift, useSetShiftOverride, useRemoveShiftOverride } from '@/hooks/useShifts';

// Shift badge colors
const SHIFT_BADGE: Record<string, string> = {
    'Morning': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'Day': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'Afternoon': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Night': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

interface Props {
    open: boolean;
    onClose: () => void;
    config: Partial<ScheduleConfig>;
    onConfigChange: (config: Partial<ScheduleConfig>) => void;
    date: string; // "2026-02-20"
}

export function ScheduleConfigSheet({ open, onClose, config, onConfigChange, date }: Props) {
    const { data: shifts } = useShifts();
    const { data: roster } = useShiftRoster(date);
    const setDefaultShift = useSetDefaultShift();
    const setOverride = useSetShiftOverride();
    const removeOverride = useRemoveShiftOverride();

    if (!open) return null;

    // Group roster by effective shift
    const grouped: Record<string, OperatorRosterEntry[]> = {};
    const unassigned: OperatorRosterEntry[] = [];
    const dayOff: OperatorRosterEntry[] = [];

    for (const entry of roster || []) {
        if (entry.isDayOff) {
            dayOff.push(entry);
        } else if (entry.effectiveShift) {
            const key = entry.effectiveShift.shiftId;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(entry);
        } else {
            unassigned.push(entry);
        }
    }

    const handleShiftChange = (operatorId: string, shiftId: string, isDefault: boolean) => {
        if (isDefault) {
            setDefaultShift.mutate({ operatorId, shiftId }, {
                onSuccess: () => toast.success('Default shift updated'),
            });
        } else {
            setOverride.mutate({ operatorId, date, shiftId }, {
                onSuccess: () => toast.success('Shift override set for today'),
            });
        }
    };

    const handleDayOff = (operatorId: string) => {
        setOverride.mutate({ operatorId, date, shiftId: null }, {
            onSuccess: () => toast.success('Marked as day off'),
        });
    };

    const handleRemoveOverride = (operatorId: string) => {
        removeOverride.mutate({ operatorId, date }, {
            onSuccess: () => toast.success('Override removed'),
        });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

            <div className="fixed right-0 top-0 bottom-0 w-[380px] max-w-full bg-card border-l border-border z-50 shadow-xl flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold">Schedule Settings</h3>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Operator Shifts */}
                    <fieldset className="space-y-3">
                        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Operator Shifts — {date}
                        </legend>

                        {(shifts || []).map(shift => {
                            const entries = grouped[shift.shiftId] || [];
                            const badgeClass = SHIFT_BADGE[shift.shiftName] || 'bg-muted text-muted-foreground';

                            return (
                                <div key={shift.shiftId} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badgeClass}`}>
                                            {shift.shiftName}
                                        </span>
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                            {shift.startTime}–{shift.endTime}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            ({entries.length})
                                        </span>
                                    </div>
                                    {entries.length > 0 ? (
                                        <div className="space-y-0.5 pl-1">
                                            {entries.map(entry => (
                                                <OperatorRow
                                                    key={entry.operatorId}
                                                    entry={entry}
                                                    shifts={shifts || []}
                                                    date={date}
                                                    onShiftChange={handleShiftChange}
                                                    onDayOff={handleDayOff}
                                                    onRemoveOverride={handleRemoveOverride}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground/60 pl-1">No operators</p>
                                    )}
                                </div>
                            );
                        })}

                        {/* Unassigned operators */}
                        {unassigned.length > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                        Unassigned
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        ({unassigned.length})
                                    </span>
                                </div>
                                <div className="space-y-0.5 pl-1">
                                    {unassigned.map(entry => (
                                        <OperatorRow
                                            key={entry.operatorId}
                                            entry={entry}
                                            shifts={shifts || []}
                                            date={date}
                                            onShiftChange={handleShiftChange}
                                            onDayOff={handleDayOff}
                                            onRemoveOverride={handleRemoveOverride}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Day off operators */}
                        {dayOff.length > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                        Day Off
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        ({dayOff.length})
                                    </span>
                                </div>
                                <div className="space-y-0.5 pl-1">
                                    {dayOff.map(entry => (
                                        <OperatorRow
                                            key={entry.operatorId}
                                            entry={entry}
                                            shifts={shifts || []}
                                            date={date}
                                            onShiftChange={handleShiftChange}
                                            onDayOff={handleDayOff}
                                            onRemoveOverride={handleRemoveOverride}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </fieldset>

                    {/* Break Duration */}
                    <fieldset className="space-y-2">
                        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meal Breaks</legend>
                        <p className="text-[11px] text-muted-foreground">
                            Static breaks: Midnight 01:00 · Breakfast 08:00 · Lunch 12:00 · Dinner 20:00
                        </p>
                        <label className="space-y-1">
                            <span className="text-xs text-muted-foreground">Break duration (min)</span>
                            <input
                                type="number"
                                min={15}
                                max={60}
                                step={5}
                                value={config.breakDuration ?? 30}
                                onChange={e => onConfigChange({ ...config, breakDuration: parseInt(e.target.value) || 30 })}
                                className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background"
                            />
                        </label>
                    </fieldset>

                    {/* Buffer */}
                    <fieldset className="space-y-2">
                        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task Buffer</legend>
                        <label className="space-y-1">
                            <span className="text-xs text-muted-foreground">Minutes between tasks</span>
                            <input
                                type="number"
                                min={0}
                                max={30}
                                step={1}
                                value={config.bufferMinutes ?? 5}
                                onChange={e => onConfigChange({ ...config, bufferMinutes: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background"
                            />
                        </label>
                    </fieldset>

                    {/* Scheduling Options */}
                    <fieldset className="space-y-3">
                        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scheduling Options</legend>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.prioritizeMandatory ?? true}
                                onChange={e => onConfigChange({ ...config, prioritizeMandatory: e.target.checked })}
                                className="rounded border-border"
                            />
                            <span className="text-xs">Prioritize mandatory tasks</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.groupByMachine ?? true}
                                onChange={e => onConfigChange({ ...config, groupByMachine: e.target.checked })}
                                className="rounded border-border"
                            />
                            <span className="text-xs">Group tasks by machine</span>
                        </label>
                    </fieldset>
                </div>
            </div>
        </>
    );
}

// --- Operator row with shift selector ---

function OperatorRow({
    entry,
    shifts,
    date: _date,
    onShiftChange,
    onDayOff,
    onRemoveOverride,
}: {
    entry: OperatorRosterEntry;
    shifts: Shift[];
    date: string;
    onShiftChange: (operatorId: string, shiftId: string, isDefault: boolean) => void;
    onDayOff: (operatorId: string) => void;
    onRemoveOverride: (operatorId: string) => void;
}) {
    return (
        <div className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-muted/30 group">
            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium truncate flex-1 min-w-0">
                {entry.operatorName}
            </span>
            {entry.hasOverride && (
                <button
                    onClick={() => onRemoveOverride(entry.operatorId)}
                    title="Remove override (revert to default)"
                    className="p-0.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                >
                    <RotateCcw className="h-3 w-3 text-muted-foreground" />
                </button>
            )}
            <select
                value={entry.isDayOff ? 'dayoff' : entry.effectiveShift?.shiftId || ''}
                onChange={e => {
                    const val = e.target.value;
                    if (val === 'dayoff') {
                        onDayOff(entry.operatorId);
                    } else if (val === '') {
                        // Unset — shouldn't happen from dropdown, but handle gracefully
                        return;
                    } else {
                        // If they have no default, set it as default. Otherwise create override for today.
                        const isDefault = !entry.defaultShiftId;
                        onShiftChange(entry.operatorId, val, isDefault);
                    }
                }}
                className="text-[11px] px-1.5 py-0.5 rounded border border-border bg-background max-w-[100px]"
            >
                <option value="">—</option>
                {shifts.map(s => (
                    <option key={s.shiftId} value={s.shiftId}>
                        {s.shiftName}
                    </option>
                ))}
                <option value="dayoff">Day Off</option>
            </select>
            {entry.hasOverride && (
                <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">OVR</span>
            )}
        </div>
    );
}
