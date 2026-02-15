import { Link } from 'react-router-dom';
import {
    Users,
    Database,
    Activity,
    AlertTriangle,
    Clock,
    Server,
    HardDrive,
    ScrollText,
    UserCog,
    MonitorDot,
    ArrowRight,
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const adminItems = [
    {
        path: '/admin/database',
        label: 'Database Explorer',
        description: 'Browse tables, view schemas, and edit records',
        icon: Database,
    },
    {
        path: '/admin/users',
        label: 'User Management',
        description: 'Manage operators and their roles',
        icon: UserCog,
    },
    {
        path: '/admin/monitoring',
        label: 'System Monitoring',
        description: 'API activity, system health, and errors',
        icon: MonitorDot,
    },
    {
        path: '/admin/logs',
        label: 'Activity Logs',
        description: 'View all API request history',
        icon: ScrollText,
    },
];

export default function AdminDashboard() {
    const { useAdminOverview, useApiTimeline, useSystemHealth } = useAdmin();
    const { data: overview, isLoading: loadingOverview } = useAdminOverview();
    const { data: timeline } = useApiTimeline(24);
    const { data: health } = useSystemHealth();

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="page-header mb-8 inline-block">
                ADMINISTRATION PANEL
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Active Users</div>
                    {loadingOverview ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                        <div className="text-2xl font-bold text-primary">{overview?.totalUsers ?? 0}</div>
                    )}
                </div>
                <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Records</div>
                    {loadingOverview ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                        <div className="text-2xl font-bold text-primary">{overview?.totalRecords ?? 0}</div>
                    )}
                </div>
                <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Requests Today</div>
                    {loadingOverview ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                        <div className="text-2xl font-bold text-info">{overview?.requestsToday ?? 0}</div>
                    )}
                </div>
                <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Errors Today</div>
                    {loadingOverview ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                        <div className="text-2xl font-bold text-destructive">{overview?.errorsToday ?? 0}</div>
                    )}
                </div>
            </div>

            {/* System Health + Traffic Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* API Traffic Chart */}
                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="section-header">API Traffic (Last 24h)</div>
                    <div className="p-4">
                        {timeline && timeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={timeline}>
                                    <XAxis
                                        dataKey="hour"
                                        tickFormatter={(val) => {
                                            const d = new Date(val);
                                            return `${d.getHours().toString().padStart(2, '0')}:00`;
                                        }}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        labelFormatter={(val) => new Date(val).toLocaleString()}
                                    />
                                    <Bar dataKey="requestCount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Requests" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                No traffic data yet
                            </div>
                        )}
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="section-header">System Health</div>
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <Server className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="flex justify-between text-sm">
                                    <span>Server Uptime</span>
                                    <span className="font-medium">{health?.server.uptimeFormatted ?? '...'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Memory (Heap)</span>
                                    <span className="font-medium">
                                        {health ? `${health.memory.heapUsedMB}MB / ${health.memory.heapTotalMB}MB` : '...'}
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${health?.memory.heapUsedPercent ?? 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>OS Memory</span>
                                    <span className="font-medium">
                                        {health ? `${health.os.usedMemoryPercent}% used` : '...'}
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            (health?.os.usedMemoryPercent ?? 0) > 90 ? 'bg-destructive'
                                                : (health?.os.usedMemoryPercent ?? 0) > 70 ? 'bg-warning'
                                                : 'bg-success'
                                        }`}
                                        style={{ width: `${health?.os.usedMemoryPercent ?? 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="flex justify-between text-sm">
                                    <span>DB Pool</span>
                                    <span className="font-medium">
                                        {health ? `${health.database.available} available / ${health.database.size} total` : '...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="flex justify-between text-sm">
                                    <span>Node.js</span>
                                    <span className="font-medium">{health?.server.nodeVersion ?? '...'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Navigation */}
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Quick Access
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adminItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30"
                            >
                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2.5 rounded-lg bg-[hsl(var(--admin))]/10 text-[hsl(var(--admin))]">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                                    </div>
                                    <h3 className="font-medium text-sm mb-1 text-foreground">{item.label}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
