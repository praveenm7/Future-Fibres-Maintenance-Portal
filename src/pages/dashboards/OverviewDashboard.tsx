import {
    Factory,
    Wrench,
    AlertTriangle,
    Clock,
    Package,
    ShieldCheck,
    CheckCircle2,
    TrendingUp,
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

const STATUS_COLORS: Record<string, string> = {
    'PENDING': 'hsl(48, 96%, 51%)',
    'IN PROGRESS': 'hsl(221, 83%, 53%)',
    'COMPLETED': 'hsl(142, 76%, 36%)',
    'CANCELLED': 'hsl(215, 16%, 47%)',
};

const AREA_COLORS = [
    'hsl(221, 83%, 53%)',
    'hsl(142, 76%, 36%)',
    'hsl(48, 96%, 51%)',
    'hsl(0, 84%, 60%)',
    'hsl(199, 89%, 48%)',
    'hsl(280, 65%, 60%)',
];

const formatMonth = (month: string) => {
    const [y, m] = month.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('default', { month: 'short' });
};

export default function OverviewDashboard() {
    const { useOverview, useExecutionSummary } = useDashboards();
    const { data, isLoading } = useOverview();
    const { data: execData, isLoading: execLoading } = useExecutionSummary();

    return (
        <DashboardShell
            title="OVERVIEW DASHBOARD"
            subtitle="High-level operational snapshot across all maintenance areas"
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
                <KPICard
                    title="Total Machines"
                    value={data?.kpis.totalMachines ?? 0}
                    icon={Factory}
                    colorClass="text-primary"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Need Maintenance"
                    value={data?.kpis.machinesNeedingMaintenance ?? 0}
                    icon={Wrench}
                    colorClass="text-warning"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Active NCs"
                    value={data?.kpis.activeNCs ?? 0}
                    icon={AlertTriangle}
                    colorClass="text-destructive"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Overdue NCs"
                    value={data?.kpis.overdueNCs ?? 0}
                    icon={Clock}
                    colorClass="text-destructive"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Critical Parts"
                    value={data?.kpis.criticalSpareParts ?? 0}
                    icon={Package}
                    colorClass="text-warning"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Compliance"
                    value={data?.kpis.complianceRate ?? 0}
                    icon={ShieldCheck}
                    suffix="%"
                    colorClass="text-success"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Done This Month"
                    value={execData ? `${execData.kpis.completedThisMonth} / ${execData.kpis.plannedThisMonth}` : '0'}
                    icon={CheckCircle2}
                    colorClass="text-emerald-600"
                    isLoading={execLoading}
                />
                <KPICard
                    title="Completion Rate"
                    value={execData?.kpis.completionRate ?? 0}
                    icon={TrendingUp}
                    suffix="%"
                    colorClass="text-emerald-600"
                    isLoading={execLoading}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="NC Status Distribution">
                    {data?.ncStatusDistribution && data.ncStatusDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.ncStatusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="count"
                                    nameKey="status"
                                    label={({ status, count }) => `${status}: ${count}`}
                                    labelLine={false}
                                >
                                    {data.ncStatusDistribution.map((entry) => (
                                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No NC data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Machines by Area">
                    {data?.machinesByArea && data.machinesByArea.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.machinesByArea} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="area" tick={{ fontSize: 11 }} width={80} />
                                <Tooltip />
                                <Bar dataKey="count" name="Machines" radius={[0, 4, 4, 0]}>
                                    {data.machinesByArea.map((_, i) => (
                                        <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No machine data available
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title="NC Trend (Last 12 Months)">
                    {data?.ncMonthlyTrend && data.ncMonthlyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.ncMonthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip labelFormatter={(v) => v} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    name="NCs Created"
                                    stroke="hsl(221, 83%, 53%)"
                                    fill="hsl(221, 83%, 53%)"
                                    fillOpacity={0.2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No trend data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Completion Trend (Last 6 Months)">
                    {execData?.completionTrend && execData.completionTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={execData.completionTrend}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip labelFormatter={formatMonth} />
                                <Legend />
                                <Bar dataKey="completed" name="Completed" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="planned" name="Planned" fill="hsl(215, 16%, 67%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No execution data yet
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Maintenance Actions by Periodicity">
                    {data?.maintenanceByPeriodicity && data.maintenanceByPeriodicity.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.maintenanceByPeriodicity}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="periodicity" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="idealCount" name="Ideal" stackId="a" fill="hsl(199, 89%, 48%)" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="mandatoryCount" name="Mandatory" stackId="a" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No maintenance data available
                        </div>
                    )}
                </ChartCard>
            </div>
        </DashboardShell>
    );
}
