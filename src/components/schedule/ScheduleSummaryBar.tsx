import { Clock, Users, CheckCircle2, AlertTriangle, Shield, Lightbulb, CalendarClock } from 'lucide-react';
import { formatTimeMinutes } from '@/components/calendar/calendarUtils';
import type { DailyScheduleSummary } from '@/types/schedule';

interface Props {
    summary: DailyScheduleSummary;
}

export function ScheduleSummaryBar({ summary }: Props) {
    return (
        <div className="flex flex-wrap gap-4 px-4 py-3 bg-card border border-border rounded-lg">
            <Stat icon={<CheckCircle2 className="h-3.5 w-3.5" />} value={`${summary.scheduledTasks} / ${summary.totalTasks}`} label="Scheduled" />
            <Stat icon={<CalendarClock className="h-3.5 w-3.5" />} value={summary.shiftCount} label={summary.shiftCount === 1 ? 'Shift' : 'Shifts'} />
            <Stat icon={<Users className="h-3.5 w-3.5" />} value={summary.operatorCount} label="Operators" />
            <Stat icon={<Clock className="h-3.5 w-3.5" />} value={formatTimeMinutes(summary.totalMinutes)} label="Total Work" />
            <Stat icon={<Shield className="h-3.5 w-3.5 text-red-500" />} value={summary.mandatoryCount} label="Mandatory" />
            <Stat icon={<Lightbulb className="h-3.5 w-3.5 text-blue-500" />} value={summary.idealCount} label="Ideal" />
            {summary.unscheduledTasks > 0 && (
                <Stat icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />} value={summary.unscheduledTasks} label="Unscheduled" className="text-amber-600" />
            )}
        </div>
    );
}

function Stat({ icon, value, label, className = '' }: { icon: React.ReactNode; value: string | number; label: string; className?: string }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-muted-foreground">{icon}</span>
            <span className="text-sm font-bold">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );
}
