import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    colorClass?: string;
    isLoading?: boolean;
    suffix?: string;
}

export function KPICard({ title, value, icon: Icon, colorClass = 'text-primary', isLoading, suffix }: KPICardProps) {
    return (
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground uppercase font-bold truncate">{title}</div>
                <Icon className={cn("h-4 w-4 flex-shrink-0", colorClass)} />
            </div>
            {isLoading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
                <div className={cn("text-2xl font-bold", colorClass)}>
                    {value}{suffix}
                </div>
            )}
        </div>
    );
}
