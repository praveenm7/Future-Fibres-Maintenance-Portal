import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Check, Clock, MapPin, RotateCcw, SkipForward, User, Wrench, Tag, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOperators } from '@/hooks/useOperators';
import {
    PERIODICITY_COLORS,
    formatTimeMinutes,
    type Periodicity,
} from '@/components/calendar/calendarUtils';
import type { ScheduledTask } from '@/types/schedule';

interface Props {
    task: ScheduledTask | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete?: (task: ScheduledTask, data: {
        status: 'COMPLETED' | 'SKIPPED';
        actualTime: number | null;
        completedById: string | null;
        notes: string | null;
    }) => void;
    onUndoComplete?: (task: ScheduledTask) => void;
}

function DetailRow({ icon: Icon, label, children }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="font-medium">{children}</div>
            </div>
        </div>
    );
}

export function ScheduleTaskSheet({ task, open, onOpenChange, onComplete, onUndoComplete }: Props) {
    const { useGetOperators } = useOperators();
    const { data: operators = [] } = useGetOperators();

    const [actualTime, setActualTime] = useState<string>('');
    const [completedById, setCompletedById] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        if (task) {
            setActualTime(task.timeNeeded.toString());
            setCompletedById(task.assignedOperatorId || '');
            setNotes('');
        }
    }, [task]);

    if (!task) return null;

    const colors = PERIODICITY_COLORS[task.periodicity as Periodicity] || PERIODICITY_COLORS['WEEKLY'];
    const isCompleted = task.executionStatus === 'COMPLETED';
    const isSkipped = task.executionStatus === 'SKIPPED';
    const hasExecution = isCompleted || isSkipped;

    const handleSubmit = (status: 'COMPLETED' | 'SKIPPED') => {
        if (onComplete) {
            onComplete(task, {
                status,
                actualTime: actualTime ? parseInt(actualTime, 10) : null,
                completedById: completedById || null,
                notes: notes.trim() || null,
            });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
                <SheetHeader className="pb-4">
                    <SheetTitle className="flex items-center gap-2.5">
                        <div className={cn('h-3 w-3 rounded-full flex-shrink-0', colors.dot)} />
                        <span className="truncate">{task.actionText}</span>
                        {isCompleted && (
                            <Badge className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                                Completed
                            </Badge>
                        )}
                        {isSkipped && (
                            <Badge variant="outline" className="ml-auto">Skipped</Badge>
                        )}
                    </SheetTitle>
                    <SheetDescription>
                        {task.startTime} – {task.endTime} ({formatTimeMinutes(task.timeNeeded)})
                    </SheetDescription>
                </SheetHeader>

                <Separator />

                {/* Machine & Schedule Info */}
                <div className="py-4 space-y-3">
                    <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <DetailRow icon={Wrench} label="Machine">
                            <span className="font-mono font-bold">{task.machineFinalCode}</span>
                        </DetailRow>
                        <DetailRow icon={MapPin} label="Area">
                            {task.machineArea || '—'}
                        </DetailRow>
                        <DetailRow icon={CalendarDays} label="Periodicity">
                            <Badge variant="secondary" className={cn(colors.bg, colors.text, 'border', colors.border)}>
                                {colors.label}
                            </Badge>
                        </DetailRow>
                        <DetailRow icon={Tag} label="Priority">
                            <Badge variant={task.status === 'MANDATORY' ? 'destructive' : 'secondary'}>
                                {task.status}
                            </Badge>
                        </DetailRow>
                        <DetailRow icon={Clock} label="Scheduled Time">
                            {task.startTime} – {task.endTime}
                        </DetailRow>
                        <DetailRow icon={User} label="Assigned To">
                            {task.assignedOperatorName}
                        </DetailRow>
                    </div>

                    {task.schedulingNotes.length > 0 && (
                        <div className="text-xs text-muted-foreground italic mt-2">
                            {task.schedulingNotes.join('. ')}
                        </div>
                    )}
                </div>

                <Separator />

                {/* Completion Section */}
                <div className="py-4 space-y-4">
                    <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Completion</h4>

                    {hasExecution ? (
                        <div className="space-y-3">
                            {task.completedByName && (
                                <DetailRow icon={User} label="Completed By">
                                    {task.completedByName}
                                </DetailRow>
                            )}
                            {onUndoComplete && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onUndoComplete(task)}
                                    className="w-full mt-2"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 mr-2" />
                                    Revert to Pending
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sched-actualTime" className="text-xs">
                                    Actual Time (minutes)
                                </Label>
                                <Input
                                    id="sched-actualTime"
                                    type="number"
                                    min={0}
                                    value={actualTime}
                                    onChange={e => setActualTime(e.target.value)}
                                    placeholder={`Estimated: ${task.timeNeeded} min`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sched-completedBy" className="text-xs">
                                    Completed By
                                </Label>
                                <Select value={completedById} onValueChange={setCompletedById}>
                                    <SelectTrigger id="sched-completedBy">
                                        <SelectValue placeholder="Select operator..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {operators.map(op => (
                                            <SelectItem key={op.id} value={op.id}>
                                                {op.operatorName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sched-notes" className="text-xs">
                                    Notes (optional)
                                </Label>
                                <Textarea
                                    id="sched-notes"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Any additional notes..."
                                    rows={2}
                                />
                            </div>

                            {onComplete && (
                                <div className="flex gap-2 pt-1">
                                    <Button
                                        onClick={() => handleSubmit('COMPLETED')}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark Complete
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSubmit('SKIPPED')}
                                    >
                                        <SkipForward className="h-4 w-4 mr-1.5" />
                                        Skip
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
