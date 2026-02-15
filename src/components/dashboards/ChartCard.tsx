import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
    title: string;
    children: ReactNode;
    className?: string;
    height?: number;
}

export function ChartCard({ title, children, className, height = 300 }: ChartCardProps) {
    return (
        <div className={cn("bg-card border border-border rounded-lg shadow-sm overflow-hidden", className)}>
            <div className="section-header">{title}</div>
            <div className="p-4" style={{ height }}>
                {children}
            </div>
        </div>
    );
}
