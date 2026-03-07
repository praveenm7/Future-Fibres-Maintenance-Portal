import {
    Users,
    ShieldCheck,
    Factory,
    Building2,
    Clock,
    CheckCircle2,
} from 'lucide-react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar,
    AreaChart, Area,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useDashboards } from '@/hooks/useDashboards';
import { KPICard } from '@/components/dashboards/KPICard';
import { DashboardShell } from '@/components/dashboards/DashboardShell';
import { ChartCard } from '@/components/dashboards/ChartCard';
import type { OperatorEfficiencyEntry, OperatorCompletionRateEntry } from '@/types/dashboards';

const DEPT_COLORS = [
    'hsl(221, 83%, 53%)',
    'hsl(142, 76%, 36%)',
    'hsl(48, 96%, 51%)',
    'hsl(0, 84%, 60%)',
    'hsl(199, 89%, 48%)',
    'hsl(280, 65%, 60%)',
    'hsl(25, 95%, 53%)',
    'hsl(330, 80%, 55%)',
];

const SHIFT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
    'Morning': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', bar: 'bg-amber-400' },
    'Day': { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', bar: 'bg-orange-400' },
    'Afternoon': { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', bar: 'bg-purple-400' },
    'Night': { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', bar: 'bg-indigo-400' },
};

const DEFAULT_SHIFT = { bg: 'bg-muted border-border', text: 'text-muted-foreground', bar: 'bg-muted-foreground' };

const formatMonth = (month: string) => {
    const [y, m] = month.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('default', { month: 'short' });
};

export default function WorkforceDashboard() {
    const { useWorkforce } = useDashboards();
    const { data, isLoading } = useWorkforce();

    // Computed KPIs
    const avgCompletionRate = data?.operatorCompletionRates && data.operatorCompletionRates.length > 0
        ? Math.round(data.operatorCompletionRates.reduce((sum: number, r: OperatorCompletionRateEntry) => sum + r.completionRate, 0) / data.operatorCompletionRates.length)
        : null;

    const avgTimeVariance = data?.operatorEfficiency && data.operatorEfficiency.length > 0
        ? Math.round(
            data.operatorEfficiency.reduce((sum: number, r: OperatorEfficiencyEntry) => sum + (r.avgActual - r.avgEstimated), 0) /
            data.operatorEfficiency.length * 10
        ) / 10
        : null;

    // Group shift coverage by shift
    const shiftGroups: Record<string, Array<{ operatorName: string; department: string }>> = {};
    if (data?.shiftCoverage) {
        for (const entry of data.shiftCoverage) {
            const key = entry.shiftName || 'Unassigned';
            if (!shiftGroups[key]) shiftGroups[key] = [];
            shiftGroups[key].push({ operatorName: entry.operatorName, department: entry.department });
        }
    }

    const totalShiftOperators = data?.shiftCoverage?.length ?? 0;

    return (
        <DashboardShell
            title="WORKFORCE & AUTHORIZATION"
            subtitle="Operator workload distribution and authorization coverage analysis"
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <KPICard
                    title="Active Operators"
                    value={data?.kpis.activeOperators ?? 0}
                    icon={Users}
                    colorClass="text-primary"
                    isLoading={isLoading}
                />
                <KPICard
                    title="With Authorizations"
                    value={data?.kpis.operatorsWithAuthorizations ?? 0}
                    icon={ShieldCheck}
                    colorClass="text-success"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Unassigned Machines"
                    value={data?.kpis.unassignedMachines ?? 0}
                    icon={Factory}
                    colorClass="text-warning"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Departments"
                    value={data?.kpis.departmentsCount ?? 0}
                    icon={Building2}
                    colorClass="text-primary"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Avg Completion"
                    value={avgCompletionRate ?? '-'}
                    suffix={avgCompletionRate != null ? '%' : ''}
                    icon={CheckCircle2}
                    colorClass="text-emerald-600"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Avg Time Variance"
                    value={avgTimeVariance != null ? `${avgTimeVariance > 0 ? '+' : ''}${avgTimeVariance}` : '-'}
                    suffix={avgTimeVariance != null ? ' min' : ''}
                    icon={Clock}
                    colorClass={avgTimeVariance != null && avgTimeVariance > 5 ? 'text-destructive' : 'text-info'}
                    isLoading={isLoading}
                />
            </div>

            {/* Row 1: Department Distribution + Authorization Coverage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="Operators by Department" height={320}>
                    {data?.operatorsByDepartment && data.operatorsByDepartment.length > 0 ? (
                        <div className="flex h-full">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.operatorsByDepartment}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={95}
                                            dataKey="count"
                                            nameKey="department"
                                            paddingAngle={2}
                                            strokeWidth={0}
                                        >
                                            {data.operatorsByDepartment.map((_: { department: string; count: number }, i: number) => (
                                                <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;
                                                const d = payload[0].payload;
                                                const total = data.operatorsByDepartment.reduce((s: number, e: { count: number }) => s + e.count, 0);
                                                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                                                return (
                                                    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                                                        <p className="font-medium">{d.department}</p>
                                                        <p className="text-muted-foreground">{d.count} operators ({pct}%)</p>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend as a clean list */}
                            <div className="w-[140px] flex flex-col justify-center gap-1.5 pr-2">
                                {data.operatorsByDepartment.map((d: { department: string; count: number }, i: number) => (
                                    <div key={d.department} className="flex items-center gap-2 text-xs">
                                        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                                        <span className="truncate text-muted-foreground">{d.department}</span>
                                        <span className="ml-auto font-medium tabular-nums">{d.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <EmptyState message="No department data available" />
                    )}
                </ChartCard>

                <ChartCard title="Authorization Coverage" height={320}>
                    {data?.authorizationCoverage && data.authorizationCoverage.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.authorizationCoverage} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                <YAxis type="category" dataKey="operatorName" tick={{ fontSize: 11 }} width={95} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                                                <p className="font-medium">{label}</p>
                                                <p className="text-muted-foreground">{payload[0].value} authorized group{payload[0].value !== 1 ? 's' : ''}</p>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="authorizedGroups" name="Authorized Groups" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="No authorization data available" />
                    )}
                </ChartCard>
            </div>

            {/* Row 2: Efficiency + Completion Rate */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="Operator Efficiency (Estimated vs Actual)" height={360}>
                    {data?.operatorEfficiency && data.operatorEfficiency.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.operatorEfficiency} margin={{ bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="operatorName" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={55} interval={0} />
                                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        const op = data.operatorEfficiency.find((r: OperatorEfficiencyEntry) => r.operatorName === label);
                                        return (
                                            <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                                                <p className="font-medium mb-1">{label}</p>
                                                <p className="text-muted-foreground">{op?.taskCount ?? 0} tasks completed</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="h-2 w-2 rounded-full bg-[hsl(221,83%,53%)]" />
                                                    <span>Estimated: {payload[0]?.value} min</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-[hsl(142,76%,36%)]" />
                                                    <span>Actual: {payload[1]?.value} min</span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 11 }}
                                    iconType="circle"
                                    iconSize={8}
                                />
                                <Bar dataKey="avgEstimated" name="Estimated" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} barSize={14} />
                                <Bar dataKey="avgActual" name="Actual" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} barSize={14} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="No efficiency data yet — complete tasks with actual times to populate" />
                    )}
                </ChartCard>

                <ChartCard title="Completion Rate by Operator (Last 3 Months)" height={360}>
                    {data?.operatorCompletionRates && data.operatorCompletionRates.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.operatorCompletionRates} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                                <YAxis type="category" dataKey="operatorName" tick={{ fontSize: 11 }} width={95} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        const op = data.operatorCompletionRates.find((r: OperatorCompletionRateEntry) => r.operatorName === label);
                                        const rate = payload[0].value as number;
                                        return (
                                            <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                                                <p className="font-medium">{label}</p>
                                                <p className={`font-semibold ${rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {rate}% completion
                                                </p>
                                                <p className="text-muted-foreground">{op?.completed}/{op?.totalTasks} tasks</p>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="completionRate" name="Completion Rate" radius={[0, 4, 4, 0]} barSize={16}>
                                    {data.operatorCompletionRates.map((entry: OperatorCompletionRateEntry, i: number) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                entry.completionRate >= 80 ? 'hsl(142, 76%, 36%)' :
                                                entry.completionRate >= 50 ? 'hsl(48, 96%, 51%)' :
                                                'hsl(0, 84%, 60%)'
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="No completion data yet — mark tasks as complete to populate" />
                    )}
                </ChartCard>
            </div>

            {/* Row 3: Shift Coverage + Completion Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Shift Coverage" height={360}>
                    {data?.shiftCoverage && data.shiftCoverage.length > 0 ? (
                        <div className="h-full overflow-y-auto px-1 space-y-3">
                            {/* Summary bar */}
                            <div className="flex items-center gap-3 pb-2 border-b border-border">
                                <span className="text-xs text-muted-foreground">{totalShiftOperators} operators across {Object.keys(shiftGroups).length} shifts</span>
                            </div>
                            {Object.entries(shiftGroups).map(([shiftName, operators]) => {
                                const colors = SHIFT_COLORS[shiftName] || DEFAULT_SHIFT;
                                return (
                                    <div key={shiftName} className={`rounded-lg border p-3 ${colors.bg}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-1.5 w-6 rounded-full ${colors.bar}`} />
                                                <span className={`text-xs font-semibold ${colors.text}`}>
                                                    {shiftName}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {operators.length} operator{operators.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {operators.map(op => (
                                                <div key={op.operatorName} className="flex items-center gap-1.5 bg-background/60 rounded px-2 py-1">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${colors.bar} shrink-0`} />
                                                    <span className="text-xs font-medium truncate">{op.operatorName}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate ml-auto">{op.department}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState message="No shift data available" />
                    )}
                </ChartCard>

                <ChartCard title="Maintenance Completion Trend (6 Months)" height={360}>
                    {data?.completionTrend && data.completionTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.completionTrend} margin={{ top: 5, right: 10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.05} />
                                    </linearGradient>
                                    <linearGradient id="gradSkipped" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip
                                    labelFormatter={formatMonth}
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        const completed = payload.find(p => p.dataKey === 'completed')?.value as number ?? 0;
                                        const skipped = payload.find(p => p.dataKey === 'skipped')?.value as number ?? 0;
                                        const total = completed + skipped;
                                        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                                        return (
                                            <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                                                <p className="font-medium mb-1">{formatMonth(label as string)}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-[hsl(142,76%,36%)]" />
                                                    <span>Completed: {completed}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-[hsl(0,84%,60%)]" />
                                                    <span>Skipped: {skipped}</span>
                                                </div>
                                                <p className="text-muted-foreground mt-1 pt-1 border-t border-border">{rate}% completion rate</p>
                                            </div>
                                        );
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 11 }}
                                    iconType="circle"
                                    iconSize={8}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="completed"
                                    name="Completed"
                                    stackId="1"
                                    stroke="hsl(142, 76%, 36%)"
                                    fill="url(#gradCompleted)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="skipped"
                                    name="Skipped"
                                    stackId="1"
                                    stroke="hsl(0, 84%, 60%)"
                                    fill="url(#gradSkipped)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="No trend data available yet" />
                    )}
                </ChartCard>
            </div>
        </DashboardShell>
    );
}

// Reusable empty state for chart cards
function EmptyState({ message }: { message: string }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-1">
            <p className="text-sm">{message}</p>
        </div>
    );
}
