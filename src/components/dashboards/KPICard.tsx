import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendData {
    value: number;
    direction: 'up' | 'down' | 'neutral';
}

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    colorClass?: string;
    isLoading?: boolean;
    suffix?: string;
    trend?: TrendData;
}

export function KPICard({ title, value, icon: Icon, colorClass = 'text-primary', isLoading, suffix, trend }: KPICardProps) {
    return (
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground uppercase font-bold truncate">{title}</div>
                <Icon className={cn("h-4 w-4 flex-shrink-0", colorClass)} />
            </div>
            {isLoading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
                <>
                    <div className={cn("text-2xl font-bold", colorClass)}>
                        {value}{suffix}
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 mt-1.5 text-xs font-medium",
                            trend.direction === 'up' && "text-emerald-600 dark:text-emerald-400",
                            trend.direction === 'down' && "text-red-600 dark:text-red-400",
                            trend.direction === 'neutral' && "text-muted-foreground",
                        )}>
                            {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
                            {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
                            {trend.direction === 'neutral' && <Minus className="h-3 w-3" />}
                            <span>
                                {trend.direction !== 'neutral' && (trend.value > 0 ? '+' : '')}
                                {trend.value}%
                            </span>
                            <span className="text-muted-foreground/60 font-normal">vs last period</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
