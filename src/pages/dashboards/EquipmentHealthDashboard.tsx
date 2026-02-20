import { useState } from 'react';
import {
    Factory,
    ClipboardCheck,
    PauseCircle,
    CalendarClock,
    AlertCircle,
    TrendingUp,
} from 'lucide-react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useDashboards } from '@/hooks/useDashboards';
import { KPICard } from '@/components/dashboards/KPICard';
import { DashboardShell } from '@/components/dashboards/DashboardShell';
import { ChartCard } from '@/components/dashboards/ChartCard';
import { DashboardFiltersBar } from '@/components/dashboards/DashboardFilters';
import type { DashboardFilters } from '@/types/dashboards';

const TYPE_COLORS: Record<string, string> = {
    'MACHINE': 'hsl(221, 83%, 53%)',
    'TOOLING': 'hsl(142, 76%, 36%)',
};

const GROUP_COLORS = [
    'hsl(221, 83%, 53%)',
    'hsl(142, 76%, 36%)',
    'hsl(48, 96%, 51%)',
    'hsl(0, 84%, 60%)',
    'hsl(199, 89%, 48%)',
    'hsl(280, 65%, 60%)',
];

const AGE_COLORS: Record<string, string> = {
    '0-2 years': 'hsl(142, 76%, 36%)',
    '3-5 years': 'hsl(199, 89%, 48%)',
    '6-10 years': 'hsl(48, 96%, 51%)',
    '10+ years': 'hsl(0, 84%, 60%)',
};

export default function EquipmentHealthDashboard() {
    const [filters, setFilters] = useState<DashboardFilters>({});
    const { useEquipmentHealth, useExecutionSummary } = useDashboards();
    const { data, isLoading } = useEquipmentHealth(filters);
    const { data: execData, isLoading: execLoading } = useExecutionSummary(filters);

    return (
        <DashboardShell
            title="EQUIPMENT HEALTH"
            subtitle="Machine status, maintenance plan compliance, and equipment aging"
            filters={
                <DashboardFiltersBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    showAreaFilter
                    showTypeFilter
                />
            }
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <KPICard
                    title="Total Machines"
                    value={data?.kpis.totalMachines ?? 0}
                    icon={Factory}
                    colorClass="text-primary"
                    isLoading={isLoading}
                />
                <KPICard
                    title="With Plans"
                    value={data?.kpis.machinesWithPlans ?? 0}
                    icon={ClipboardCheck}
                    colorClass="text-success"
                    isLoading={isLoading}
                />
                <KPICard
                    title="On Hold"
                    value={data?.kpis.machinesOnHold ?? 0}
                    icon={PauseCircle}
                    colorClass="text-warning"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Avg Age"
                    value={data?.kpis.avgMachineAge != null ? Math.round(data.kpis.avgMachineAge) : '-'}
                    icon={CalendarClock}
                    suffix={data?.kpis.avgMachineAge != null ? 'y' : ''}
                    colorClass="text-info"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Without Plans"
                    value={data?.kpis.machinesWithoutPlans ?? 0}
                    icon={AlertCircle}
                    colorClass="text-destructive"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Plan Execution"
                    value={execData?.kpis.completionRate ?? 0}
                    icon={TrendingUp}
                    suffix="%"
                    colorClass="text-emerald-600"
                    isLoading={execLoading}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="Machine Type Distribution">
                    {data?.machineTypeDistribution && data.machineTypeDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.machineTypeDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="count"
                                    nameKey="type"
                                    label={({ type, count }) => `${type}: ${count}`}
                                    labelLine={false}
                                >
                                    {data.machineTypeDistribution.map((entry) => (
                                        <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || '#8884d8'} />
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

                <ChartCard title="Machines by Group">
                    {data?.machinesByGroup && data.machinesByGroup.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.machinesByGroup}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="group" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" name="Machines" radius={[4, 4, 0, 0]}>
                                    {data.machinesByGroup.map((_, i) => (
                                        <Cell key={i} fill={GROUP_COLORS[i % GROUP_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No data available
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Maintenance Actions by Periodicity">
                    {data?.maintenanceActionsBreakdown && data.maintenanceActionsBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.maintenanceActionsBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="periodicity" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="idealCount" name="Ideal" stackId="a" fill="hsl(199, 89%, 48%)" />
                                <Bar dataKey="mandatoryCount" name="Mandatory" stackId="a" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Equipment Age Distribution">
                    {data?.ageDistribution && data.ageDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.ageDistribution}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="bracket" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" name="Machines" radius={[4, 4, 0, 0]}>
                                    {data.ageDistribution.map((entry) => (
                                        <Cell key={entry.bracket} fill={AGE_COLORS[entry.bracket] || '#8884d8'} />
                                    ))}
                                </Bar>
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
