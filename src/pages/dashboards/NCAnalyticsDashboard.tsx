import { useState } from 'react';
import {
    AlertTriangle,
    FileText,
    Clock,
    CalendarDays,
    AlertOctagon,
    CheckCircle2,
} from 'lucide-react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar,
    LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useDashboards } from '@/hooks/useDashboards';
import { KPICard } from '@/components/dashboards/KPICard';
import { DashboardShell } from '@/components/dashboards/DashboardShell';
import { ChartCard } from '@/components/dashboards/ChartCard';
import { DashboardFiltersBar } from '@/components/dashboards/DashboardFilters';
import type { DashboardFilters } from '@/types/dashboards';

const STATUS_COLORS: Record<string, string> = {
    'PENDING': 'hsl(48, 96%, 51%)',
    'IN PROGRESS': 'hsl(221, 83%, 53%)',
    'COMPLETED': 'hsl(142, 76%, 36%)',
    'CANCELLED': 'hsl(215, 16%, 47%)',
};

const CATEGORY_COLORS: Record<string, string> = {
    'FAILURE': 'hsl(0, 84%, 60%)',
    'PREVENTIVE': 'hsl(221, 83%, 53%)',
    'UNKNOWN': 'hsl(215, 16%, 47%)',
};

const formatMonth = (month: string) => {
    const [y, m] = month.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('default', { month: 'short' });
};

// Transform monthly trend by category into chart-friendly format
const transformTrendData = (data: Array<{ month: string; category: string; count: number }>) => {
    const grouped: Record<string, Record<string, number>> = {};
    data.forEach(({ month, category, count }) => {
        if (!grouped[month]) grouped[month] = { month };
        grouped[month][category] = count;
    });
    return Object.values(grouped);
};

export default function NCAnalyticsDashboard() {
    const [filters, setFilters] = useState<DashboardFilters>({});
    const { useNCAnalytics } = useDashboards();
    const { data, isLoading } = useNCAnalytics(filters);

    const trendData = data?.monthlyTrendByCategory ? transformTrendData(data.monthlyTrendByCategory) : [];

    return (
        <DashboardShell
            title="NC ANALYTICS"
            subtitle="Non-conformity patterns, resolution efficiency, and priority analysis"
            filters={
                <DashboardFiltersBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    showAreaFilter
                    showTypeFilter={false}
                />
            }
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <KPICard
                    title="Total NCs"
                    value={data?.kpis.totalNCs ?? 0}
                    icon={FileText}
                    colorClass="text-primary"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Open NCs"
                    value={data?.kpis.openNCs ?? 0}
                    icon={AlertTriangle}
                    colorClass="text-warning"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Avg Resolution"
                    value={data?.kpis.avgResolutionDays != null ? Math.round(data.kpis.avgResolutionDays) : '-'}
                    icon={Clock}
                    suffix={data?.kpis.avgResolutionDays != null ? 'd' : ''}
                    colorClass="text-info"
                    isLoading={isLoading}
                />
                <KPICard
                    title="This Month"
                    value={data?.kpis.ncsThisMonth ?? 0}
                    icon={CalendarDays}
                    colorClass="text-primary"
                    isLoading={isLoading}
                />
                <KPICard
                    title="High Priority"
                    value={data?.kpis.highPriorityOpen ?? 0}
                    icon={AlertOctagon}
                    colorClass="text-destructive"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Completion Rate"
                    value={data?.kpis.completionRate ?? 0}
                    icon={CheckCircle2}
                    suffix="%"
                    colorClass="text-success"
                    isLoading={isLoading}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="NCs by Status">
                    {data?.ncsByStatus && data.ncsByStatus.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.ncsByStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="count"
                                    nameKey="status"
                                    label={({ status, count }) => `${status}: ${count}`}
                                    labelLine={false}
                                >
                                    {data.ncsByStatus.map((entry) => (
                                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="NC Trend by Category (Last 12 Months)">
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip labelFormatter={(v) => v} />
                                <Legend />
                                <Line type="monotone" dataKey="FAILURE" name="Failure" stroke={CATEGORY_COLORS.FAILURE} strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="PREVENTIVE" name="Preventive" stroke={CATEGORY_COLORS.PREVENTIVE} strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No trend data available
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <ChartCard title="Priority Distribution">
                    {data?.priorityDistribution && data.priorityDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.priorityDistribution}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" name="NCs" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Avg Resolution Time by Area">
                    {data?.avgResolutionByArea && data.avgResolutionByArea.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.avgResolutionByArea} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="area" tick={{ fontSize: 11 }} width={80} />
                                <Tooltip formatter={(value: number) => [`${Math.round(value)} days`, 'Avg Days']} />
                                <Bar dataKey="avgDays" name="Avg Days" fill="hsl(48, 96%, 51%)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No resolution data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Top Machines by NC Count">
                    {data?.topMachinesByNCs && data.topMachinesByNCs.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topMachinesByNCs} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="finalCode" tick={{ fontSize: 10 }} width={80} />
                                <Tooltip formatter={(value: number) => [value, 'NCs']} />
                                <Bar dataKey="ncCount" name="NCs" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No data available
                        </div>
                    )}
                </ChartCard>
            </div>
        </DashboardShell>
    );
}
