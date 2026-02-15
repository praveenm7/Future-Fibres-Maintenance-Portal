import {
    Users,
    ShieldCheck,
    BarChart3,
    Factory,
    Building2,
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

const DEPT_COLORS = [
    'hsl(221, 83%, 53%)',
    'hsl(142, 76%, 36%)',
    'hsl(48, 96%, 51%)',
    'hsl(0, 84%, 60%)',
    'hsl(199, 89%, 48%)',
];

export default function WorkforceDashboard() {
    const { useWorkforce } = useDashboards();
    const { data, isLoading } = useWorkforce();

    return (
        <DashboardShell
            title="WORKFORCE & AUTHORIZATION"
            subtitle="Operator workload distribution and authorization coverage analysis"
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
            </div>

            {/* Charts Row 1 */}
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
                                    {data.operatorsByDepartment.map((_, i) => (
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

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </DashboardShell>
    );
}
