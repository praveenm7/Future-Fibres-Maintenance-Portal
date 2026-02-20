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

const SERVER_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api').replace('/api', '');

import {
  CalendarEvent,
  PERIODICITY_COLORS,
  format,
  formatTimeMinutes,
} from './calendarUtils';

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (event: CalendarEvent, data: {
    status: 'COMPLETED' | 'SKIPPED';
    actualTime: number | null;
    completedById: string | null;
    notes: string | null;
  }) => void;
  onUndoComplete?: (event: CalendarEvent) => void;
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
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

export function EventDetailSheet({
  event,
  open,
  onOpenChange,
  onComplete,
  onUndoComplete,
}: EventDetailSheetProps) {
  const { useGetOperators } = useOperators();
  const { data: operators = [] } = useGetOperators();

  // Form state
  const [actualTime, setActualTime] = useState<string>('');
  const [completedById, setCompletedById] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Reset form when event changes
  useEffect(() => {
    if (event) {
      if (event.execution) {
        setActualTime(event.execution.actualTime?.toString() || event.action.timeNeeded.toString());
        setCompletedById(event.execution.completedById || '');
        setNotes(event.execution.notes || '');
      } else {
        setActualTime(event.action.timeNeeded.toString());
        setCompletedById('');
        setNotes('');
      }
    }
  }, [event]);

  if (!event) return null;

  const { action, machine, date, execution } = event;
  const colors = PERIODICITY_COLORS[action.periodicity];
  const isCompleted = execution?.status === 'COMPLETED';
  const isSkipped = execution?.status === 'SKIPPED';
  const hasExecution = isCompleted || isSkipped;

  const handleSubmit = (status: 'COMPLETED' | 'SKIPPED') => {
    if (onComplete) {
      onComplete(event, {
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
            <span className="truncate">{action.action}</span>
            {isCompleted && (
              <Badge className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                Completed
              </Badge>
            )}
            {isSkipped && (
              <Badge variant="outline" className="ml-auto">
                Skipped
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Scheduled for {format(date, 'EEEE, MMMM d, yyyy')}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {/* Machine Info */}
        <div className="py-4 space-y-3">
          <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
            Machine
          </h4>
          <div className="flex items-center gap-3">
            {machine.imageUrl ? (
              <img
                src={machine.imageUrl.startsWith('http') ? machine.imageUrl : `${SERVER_BASE}${machine.imageUrl}`}
                alt={machine.finalCode}
                className="h-12 w-12 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Wrench className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-mono font-bold text-sm">{machine.finalCode}</p>
              <p className="text-sm text-muted-foreground truncate">
                {machine.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <DetailRow icon={MapPin} label="Area">
              {machine.area || '—'}
            </DetailRow>
            <DetailRow icon={Tag} label="Type">
              {machine.type || '—'}
            </DetailRow>
            <DetailRow icon={Wrench} label="Model">
              {machine.manufacturer
                ? `${machine.manufacturer} ${machine.model || ''}`
                : machine.model || '—'}
            </DetailRow>
            <DetailRow icon={User} label="Person In Charge">
              {machine.personInCharge || '—'}
            </DetailRow>
          </div>
        </div>

        <Separator />

        {/* Action Details */}
        <div className="py-4 space-y-3">
          <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
            Action Details
          </h4>

          <div className="space-y-3">
            <DetailRow icon={CalendarDays} label="Periodicity">
              <Badge
                variant="secondary"
                className={cn(colors.bg, colors.text, 'border', colors.border)}
              >
                {colors.label}
              </Badge>
            </DetailRow>

            <DetailRow icon={Clock} label="Time Needed">
              {formatTimeMinutes(action.timeNeeded)} ({action.timeNeeded} min)
            </DetailRow>

            <DetailRow icon={Tag} label="Status">
              <Badge
                variant={action.status === 'MANDATORY' ? 'destructive' : 'secondary'}
              >
                {action.status}
              </Badge>
            </DetailRow>

            <DetailRow icon={User} label="Maintenance In Charge">
              {action.maintenanceInCharge ? 'Yes' : 'No'}
            </DetailRow>

            {action.month && (
              <DetailRow icon={CalendarDays} label="Scheduled Month">
                {action.month}
              </DetailRow>
            )}
          </div>
        </div>

        <Separator />

        {/* Completion Section */}
        <div className="py-4 space-y-4">
          <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
            Completion
          </h4>

          {hasExecution ? (
            /* Already completed/skipped — show read-only summary */
            <div className="space-y-3">
              {execution?.actualTime != null && (
                <DetailRow icon={Clock} label="Actual Time">
                  {formatTimeMinutes(execution.actualTime)} ({execution.actualTime} min)
                </DetailRow>
              )}
              {execution?.completedByName && (
                <DetailRow icon={User} label="Completed By">
                  {execution.completedByName}
                </DetailRow>
              )}
              {execution?.completedDate && (
                <DetailRow icon={CalendarDays} label="Completed On">
                  {new Date(execution.completedDate).toLocaleString()}
                </DetailRow>
              )}
              {execution?.notes && (
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted/50 rounded-md p-2">{execution.notes}</p>
                </div>
              )}
              {onUndoComplete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUndoComplete(event)}
                  className="w-full mt-2"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                  Revert to Pending
                </Button>
              )}
            </div>
          ) : (
            /* Not yet completed — show form */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="actualTime" className="text-xs">
                  Actual Time (minutes)
                </Label>
                <Input
                  id="actualTime"
                  type="number"
                  min={0}
                  value={actualTime}
                  onChange={(e) => setActualTime(e.target.value)}
                  placeholder={`Estimated: ${action.timeNeeded} min`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completedBy" className="text-xs">
                  Completed By
                </Label>
                <Select value={completedById} onValueChange={setCompletedById}>
                  <SelectTrigger id="completedBy">
                    <SelectValue placeholder="Select operator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.operatorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
