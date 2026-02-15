import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, User, Wrench, Tag, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
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
}: EventDetailSheetProps) {
  if (!event) return null;

  const { action, machine, date } = event;
  const colors = PERIODICITY_COLORS[action.periodicity];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2.5">
            <div className={cn('h-3 w-3 rounded-full flex-shrink-0', colors.dot)} />
            <span className="truncate">{action.action}</span>
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
                src={machine.imageUrl}
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
      </SheetContent>
    </Sheet>
  );
}
