import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  children: ReactNode;
  variant?: 'red' | 'green' | 'blue' | 'yellow';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses = {
  red: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  green: 'bg-success text-success-foreground hover:bg-success/90',
  blue: 'bg-primary text-primary-foreground hover:bg-primary/90',
  yellow: 'bg-warning text-warning-foreground hover:bg-warning/90',
};

export function ActionButton({
  children,
  variant = 'red',
  onClick,
  className = '',
  disabled = false,
  type = 'button'
}: ActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium min-h-[44px] sm:min-h-0 transition-all duration-150 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
