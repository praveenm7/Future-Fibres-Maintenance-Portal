import { cn } from '@/lib/utils';

type StatusVariant = 'status' | 'priority' | 'category';

interface StatusBadgeProps {
  value: string | number;
  variant?: StatusVariant;
  className?: string;
}

const STATUS_CONFIG: Record<string, { dot: string; text: string; bg: string }> = {
  'PENDING': { dot: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  'IN PROGRESS': { dot: 'bg-blue-400', text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  'COMPLETED': { dot: 'bg-emerald-400', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  'CANCELLED': { dot: 'bg-gray-400', text: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20' },
};

const PRIORITY_CONFIG: Record<number, { label: string; text: string; bg: string }> = {
  1: { label: 'Low', text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  2: { label: 'Medium', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  3: { label: 'High', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
};

const CATEGORY_CONFIG: Record<string, { text: string; bg: string }> = {
  'FAILURE': { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  'PREVENTIVE': { text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  'UNKNOWN': { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
};

function formatStatusLabel(status: string): string {
  if (status === 'IN PROGRESS') return 'In Progress';
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function StatusBadge({ value, variant = 'status', className }: StatusBadgeProps) {
  if (variant === 'priority') {
    const priority = typeof value === 'number' ? value : parseInt(String(value), 10);
    const config = PRIORITY_CONFIG[priority >= 3 ? 3 : priority] || PRIORITY_CONFIG[1];
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', config.bg, config.text, className)}>
        {config.label}
      </span>
    );
  }

  if (variant === 'category') {
    const strValue = String(value);
    const config = CATEGORY_CONFIG[strValue] || CATEGORY_CONFIG['UNKNOWN'];
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', config.bg, config.text, className)}>
        {formatStatusLabel(strValue)}
      </span>
    );
  }

  // Default: status variant
  const strValue = String(value);
  const config = STATUS_CONFIG[strValue] || STATUS_CONFIG['PENDING'];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {formatStatusLabel(strValue)}
    </span>
  );
}
