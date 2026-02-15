import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
}

export function BulkActionsBar({ selectedCount, actions, onClear }: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-0 z-20 flex items-center gap-3 px-4 py-2.5 bg-primary text-primary-foreground rounded-b-lg border-t border-primary/20 animate-in slide-in-from-bottom-2 duration-200">
      <span className="text-sm font-medium">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>

      <div className="flex items-center gap-2 ml-auto">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              action.variant === 'destructive'
                ? 'bg-destructive/90 text-destructive-foreground hover:bg-destructive'
                : 'bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground'
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onClear}
          className="ml-2 h-7 w-7 rounded-md flex items-center justify-center hover:bg-primary-foreground/15 transition-colors"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
