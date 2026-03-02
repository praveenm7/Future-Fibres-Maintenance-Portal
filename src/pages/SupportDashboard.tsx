import {
    Ticket,
    AlertTriangle,
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
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { KPICard } from '@/components/dashboards/KPICard';
import { DashboardShell } from '@/components/dashboards/DashboardShell';
import { ChartCard } from '@/components/dashboards/ChartCard';

// ── Color mappings ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    'SUBMITTED': '#94a3b8',
    'APPROVED': '#3b82f6',
    'ASSIGNED': '#6366f1',
    'IN PROGRESS': '#f59e0b',
    'RESOLVED': '#22c55e',
    'CLOSED': '#6b7280',
    'CANCELLED': '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
    'CRITICAL': '#ef4444',
    'HIGH': '#f97316',
    'MEDIUM': '#eab308',
    'LOW': '#22c55e',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatMonth = (month: string) => {
    const [y, m] = month.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('default', { month: 'short' });
};

// ── Component ───────────────────────────────────────────────────────────────

export default function SupportDashboard() {
    const { useSupportDashboard } = useSupportTickets();
    const { data, isLoading } = useSupportDashboard();

    return (
        <DashboardShell
            title="SUPPORT DASHBOARD"
            subtitle="Ticket analytics and KPI overview"
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <KPICard
                    title="Open Tickets"
                    value={data?.kpis.openTickets ?? 0}
                    icon={Ticket}
                    colorClass="text-primary"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Overdue"
                    value={data?.kpis.overdueTickets ?? 0}
                    icon={AlertTriangle}
                    colorClass="text-destructive"
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
                    title="Critical Open"
                    value={data?.kpis.criticalOpen ?? 0}
                    icon={AlertOctagon}
                    colorClass="text-destructive"
                    isLoading={isLoading}
                />
                <KPICard
                    title="This Month"
                    value={data?.kpis.ticketsThisMonth ?? 0}
                    icon={CalendarDays}
                    colorClass="text-primary"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Resolution Rate"
                    value={data?.kpis.resolutionRate ?? 0}
                    icon={CheckCircle2}
                    suffix="%"
                    colorClass="text-success"
                    isLoading={isLoading}
                />
            </div>

            {/* Charts Row 1 — Status Pie + Monthly Trend Line */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="Tickets by Status">
                    {data?.ticketsByStatus && data.ticketsByStatus.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.ticketsByStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="count"
                                    nameKey="status"
                                    label={({ status, count }) => `${status}: ${count}`}
                                    labelLine={false}
                                >
                                    {data.ticketsByStatus.map((entry) => (
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

                <ChartCard title="Monthly Ticket Trend">
                    {data?.monthlyTrend && data.monthlyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip labelFormatter={(v) => v} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="Tickets"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No trend data available
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 2 — Priority Bar + Category Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="Tickets by Priority">
                    {data?.ticketsByPriority && data.ticketsByPriority.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.ticketsByPriority}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                                    {data.ticketsByPriority.map((entry) => (
                                        <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || '#8884d8'} />
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

                <ChartCard title="Tickets by Category">
                    {data?.ticketsByCategory && data.ticketsByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.ticketsByCategory} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={100} />
                                <Tooltip />
                                <Bar dataKey="count" name="Tickets" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No data available
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Table — Top 10 Machines by Ticket Count */}
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="section-header">Top 10 Machines by Ticket Count</div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                            ))}
                        </div>
                    ) : data?.topMachinesByTickets && data.topMachinesByTickets.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">#</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Final Code</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Description</th>
                                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Tickets</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topMachinesByTickets.map((machine, index) => (
                                    <tr
                                        key={machine.finalCode}
                                        className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium">{machine.finalCode}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{machine.description}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{machine.ticketCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No machine data available
                        </div>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
