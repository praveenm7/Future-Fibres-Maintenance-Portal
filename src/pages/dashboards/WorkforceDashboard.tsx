import {
    Users,
    ShieldCheck,
    BarChart3,
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
];

const SHIFT_BADGE_COLORS: Record<string, string> = {
    'Morning': 'bg-amber-100 text-amber-800',
    'Day': 'bg-orange-100 text-orange-800',
    'Afternoon': 'bg-purple-100 text-purple-800',
    'Night': 'bg-indigo-100 text-indigo-800',
};

const formatMonth = (month: string) => {
    const [y, m] = month.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('default', { month: 'short' });
};

export default function WorkforceDashboard() {
    const { useWorkforce } = useDashboards();
    const { data, isLoading } = useWorkforce();

    // Computed KPIs from new data
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

    return (
        <DashboardShell
            title="WORKFORCE & AUTHORIZATION"
            subtitle="Operator workload distribution and authorization coverage analysis"
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
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
                    title="Avg NCs/Operator"
                    value={data?.kpis.avgNCsPerOperator != null ? Math.round(data.kpis.avgNCsPerOperator * 10) / 10 : '-'}
                    icon={BarChart3}
                    colorClass="text-info"
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

            {/* Charts Row 1 — existing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="NC Workload by Operator">
                    {data?.ncWorkloadByOperator && data.ncWorkloadByOperator.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.ncWorkloadByOperator}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="operatorName" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="ncCount" name="NCs Assigned" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No workload data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Operators by Department">
                    {data?.operatorsByDepartment && data.operatorsByDepartment.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.operatorsByDepartment}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="count"
                                    nameKey="department"
                                    label={({ department, count }) => `${department}: ${count}`}
                                    labelLine={false}
                                >
                                    {data.operatorsByDepartment.map((_: { department: string; count: number }, i: number) => (
                                        <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No department data available
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 2 — existing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="Authorization Coverage (Groups per Operator)">
                    {data?.authorizationCoverage && data.authorizationCoverage.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.authorizationCoverage} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="operatorName" tick={{ fontSize: 11 }} width={90} />
                                <Tooltip />
                                <Bar dataKey="authorizedGroups" name="Authorized Groups" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No authorization data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Operator NC Performance">
                    {data?.operatorPerformance && data.operatorPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.operatorPerformance}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="operatorName" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="totalAssigned" name="Total Assigned" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="completed" name="Completed" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No performance data available
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 3 — NEW: Operator Efficiency + Completion Rates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="Operator Efficiency (Est. vs Actual Time)">
                    {data?.operatorEfficiency && data.operatorEfficiency.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.operatorEfficiency}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="operatorName" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                                <Tooltip
                                    formatter={(value: number, name: string) => [`${value} min`, name]}
                                    labelFormatter={(label) => {
                                        const op = data.operatorEfficiency.find((r: OperatorEfficiencyEntry) => r.operatorName === label);
                                        return op ? `${label} (${op.taskCount} tasks)` : label;
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="avgEstimated" name="Avg Estimated" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="avgActual" name="Avg Actual" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No efficiency data available — complete some tasks with actual times to see this chart
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Completion Rate by Operator (Last 3 Months)">
                    {data?.operatorCompletionRates && data.operatorCompletionRates.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.operatorCompletionRates} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                                <YAxis type="category" dataKey="operatorName" tick={{ fontSize: 11 }} width={90} />
                                <Tooltip
                                    formatter={(value: number) => [`${value}%`]}
                                    labelFormatter={(label) => {
                                        const op = data.operatorCompletionRates.find((r: OperatorCompletionRateEntry) => r.operatorName === label);
                                        return op ? `${label}: ${op.completed}/${op.totalTasks} tasks` : label;
                                    }}
                                />
                                <Bar dataKey="completionRate" name="Completion Rate" radius={[0, 4, 4, 0]}>
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
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No completion data available — mark tasks as complete to see this chart
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 4 — NEW: Shift Coverage + Completion Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Shift Coverage">
                    {data?.shiftCoverage && data.shiftCoverage.length > 0 ? (
                        <div className="h-full overflow-y-auto px-1">
                            <div className="space-y-4">
                                {Object.entries(shiftGroups).map(([shiftName, operators]) => (
                                    <div key={shiftName}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${SHIFT_BADGE_COLORS[shiftName] || 'bg-muted text-muted-foreground'}`}>
                                                {shiftName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {operators.length} operator{operators.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1">
                                            {operators.map(op => (
                                                <div key={op.operatorName} className="flex items-center gap-2 px-2 py-1 rounded bg-muted/20 text-xs">
                                                    <span className="font-medium truncate">{op.operatorName}</span>
                                                    <span className="text-muted-foreground text-[10px] truncate">{op.department}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No shift data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Maintenance Completion Trend (6 Months)">
                    {data?.completionTrend && data.completionTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.completionTrend}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip labelFormatter={formatMonth} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="completed"
                                    name="Completed"
                                    stackId="1"
                                    stroke="hsl(142, 76%, 36%)"
                                    fill="hsl(142, 76%, 36%)"
                                    fillOpacity={0.4}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="skipped"
                                    name="Skipped"
                                    stackId="1"
                                    stroke="hsl(0, 84%, 60%)"
                                    fill="hsl(0, 84%, 60%)"
                                    fillOpacity={0.4}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No trend data available yet
                        </div>
                    )}
                </ChartCard>
            </div>
        </DashboardShell>
    );
}
