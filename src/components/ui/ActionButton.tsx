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
  blue: 'bg-info text-info-foreground hover:bg-info/90',
  yellow: 'bg-accent text-accent-foreground hover:bg-accent/90',
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
        'px-4 py-2 font-bold text-sm uppercase tracking-wide transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
