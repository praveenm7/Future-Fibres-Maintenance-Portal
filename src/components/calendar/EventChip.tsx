import { memo } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CalendarEvent, PERIODICITY_COLORS, formatTimeMinutes } from './calendarUtils';

interface EventChipProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick: (event: CalendarEvent) => void;
}

export const EventChip = memo(function EventChip({
  event,
  compact = false,
  onClick,
}: EventChipProps) {
  const colors = PERIODICITY_COLORS[event.action.periodicity];
  const isMandatory = event.action.status === 'MANDATORY';

  const chipContent = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className={cn(
        'w-full text-left rounded px-1.5 py-0.5 text-xs transition-colors cursor-pointer',
        'border hover:shadow-sm',
        colors.bg,
        colors.text,
        colors.border,
        isMandatory && 'border-l-2 border-l-red-400 dark:border-l-red-500'
      )}
    >
      {compact ? (
        <div className="flex items-center gap-1 min-w-0">
          <div
            className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', colors.dot)}
          />
          <span className="truncate font-medium">
            {event.machine.finalCode}
          </span>
          <span className="truncate opacity-75">{event.action.action}</span>
        </div>
      ) : (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className={cn(
                'h-2 w-2 rounded-full flex-shrink-0',
                colors.dot
              )}
            />
            <span className="font-semibold truncate">
              {event.machine.finalCode}
            </span>
          </div>
          <p className="truncate pl-3.5">{event.action.action}</p>
          <div className="flex items-center gap-2 pl-3.5 opacity-75">
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {formatTimeMinutes(event.action.timeNeeded)}
            </span>
            {isMandatory && (
              <span className="font-semibold text-red-600 dark:text-red-400 text-[10px] uppercase">
                Mandatory
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{chipContent}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="text-xs space-y-1">
          <p className="font-semibold">{event.action.action}</p>
          <p className="text-muted-foreground">
            {event.machine.finalCode} — {event.machine.description}
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <Clock className="h-3 w-3" />
            <span>{event.action.timeNeeded} min</span>
            <span className="text-muted-foreground">|</span>
            <span>{PERIODICITY_COLORS[event.action.periodicity].label}</span>
            {isMandatory && (
              <span className="text-red-500 font-semibold">MANDATORY</span>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});
