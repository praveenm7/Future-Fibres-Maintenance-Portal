import { useState } from 'react';
import {
    Activity,
    Server,
    HardDrive,
    Cpu,
    Database,
    Clock,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdmin } from '@/hooks/useAdmin';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-success/15 text-success',
    POST: 'bg-primary/15 text-primary',
    PUT: 'bg-warning/15 text-warning',
    DELETE: 'bg-destructive/15 text-destructive',
};

export default function SystemMonitoring() {
    const { useApiActivity, useApiTimeline, useSystemHealth, useErrorLogs } = useAdmin();

    const [timeRange, setTimeRange] = useState(24);
    const [errorPage, setErrorPage] = useState(1);
    const [expandedError, setExpandedError] = useState<number | null>(null);

    const { data: apiActivity } = useApiActivity(timeRange);
    const { data: timeline } = useApiTimeline(timeRange);
    const { data: health } = useSystemHealth();
    const { data: errors } = useErrorLogs(errorPage);

    const HealthGauge = ({ label, value, max, unit, icon: Icon }: {
        label: string; value: number; max: number; unit: string; icon: any;
    }) => {
        const percent = Math.min(100, Math.round((value / max) * 100));
        const color = percent > 90 ? 'bg-destructive' : percent > 70 ? 'bg-warning' : 'bg-primary';
        return (
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                        <span>{label}</span>
                        <span className="font-medium">{value}{unit} / {max}{unit} ({percent}%)</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="page-header inline-block">
                    SYSTEM MONITORING
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Time range:</span>
                    <Select value={String(timeRange)} onValueChange={(v) => setTimeRange(Number(v))}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Last hour</SelectItem>
                            <SelectItem value="6">Last 6 hours</SelectItem>
                            <SelectItem value="24">Last 24 hours</SelectItem>
                            <SelectItem value="72">Last 3 days</SelectItem>
                            <SelectItem value="168">Last 7 days</SelectItem>
                            <SelectItem value="720">Last 30 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="api-activity">
                <TabsList>
                    <TabsTrigger value="api-activity">API Activity</TabsTrigger>
                    <TabsTrigger value="system-health">System Health</TabsTrigger>
                    <TabsTrigger value="error-log">Error Log</TabsTrigger>
                </TabsList>

                {/* API Activity Tab */}
                <TabsContent value="api-activity" className="space-y-6">
                    {/* Timeline Chart */}
                    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                        <div className="section-header">Requests Over Time</div>
                        <div className="p-4">
                            {timeline && timeline.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={timeline}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="hour"
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                if (timeRange > 168) {
                                                    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                                                }
                                                return `${d.getHours().toString().padStart(2, '0')}:00`;
                                            }}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            labelFormatter={(val) => new Date(val).toLocaleString()}
                                            formatter={(value: number, name: string) => [value, name === 'requestCount' ? 'Requests' : name === 'errorCount' ? 'Errors' : name]}
                                        />
                                        <Bar dataKey="requestCount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Requests" />
                                        <Bar dataKey="errorCount" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Errors" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    No activity data for the selected time range
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Response Time Chart */}
                    {timeline && timeline.length > 0 && (
                        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                            <div className="section-header">Average Response Time (ms)</div>
                            <div className="p-4">
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={timeline}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="hour"
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                if (timeRange > 168) {
                                                    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                                                }
                                                return `${d.getHours().toString().padStart(2, '0')}:00`;
                                            }}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <YAxis tick={{ fontSize: 11 }} unit="ms" />
                                        <Tooltip
                                            labelFormatter={(val) => new Date(val).toLocaleString()}
                                            formatter={(value: number) => [`${value}ms`, 'Avg Response Time']}
                                        />
                                        <Line type="monotone" dataKey="avgResponseTime" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Top Endpoints Table */}
                    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                        <div className="section-header">Top Endpoints</div>
                        <div className="p-0">
                            {apiActivity && apiActivity.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Endpoint</TableHead>
                                            <TableHead className="text-right">Requests</TableHead>
                                            <TableHead className="text-right">Avg (ms)</TableHead>
                                            <TableHead className="text-right">Max (ms)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {apiActivity.map((stat, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <Badge className={`text-xs ${METHOD_COLORS[stat.method] || 'bg-muted text-muted-foreground'}`}>
                                                        {stat.method}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{stat.path}</TableCell>
                                                <TableCell className="text-right font-medium">{stat.requestCount}</TableCell>
                                                <TableCell className="text-right">{stat.avgResponseTime}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{stat.maxResponseTime}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">No endpoint data available</div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* System Health Tab */}
                <TabsContent value="system-health" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Server Info */}
                        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                            <div className="section-header flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                Server Info
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Uptime</p>
                                        <p className="font-medium">{health?.server.uptimeFormatted ?? '...'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Node.js</p>
                                        <p className="font-medium">{health?.server.nodeVersion ?? '...'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Platform</p>
                                        <p className="font-medium">{health?.server.platform ?? '...'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Process ID</p>
                                        <p className="font-medium font-mono">{health?.server.pid ?? '...'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DB Pool */}
                        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                            <div className="section-header flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Database Pool
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Pool Size</p>
                                        <p className="font-medium">{health?.database.size ?? '...'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Available</p>
                                        <p className="font-medium text-success">{health?.database.available ?? '...'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Borrowed</p>
                                        <p className="font-medium text-primary">{health?.database.borrowed ?? '...'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Pending</p>
                                        <p className="font-medium text-warning">{health?.database.pending ?? '...'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Memory Gauges */}
                    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                        <div className="section-header flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            Memory Usage
                        </div>
                        <div className="p-4 space-y-4">
                            {health ? (
                                <>
                                    <HealthGauge
                                        label="Heap Memory"
                                        value={health.memory.heapUsedMB}
                                        max={health.memory.heapTotalMB}
                                        unit="MB"
                                        icon={HardDrive}
                                    />
                                    <HealthGauge
                                        label="RSS (Total Process)"
                                        value={health.memory.rssMB}
                                        max={Math.round(health.memory.heapTotalMB * 2)}
                                        unit="MB"
                                        icon={Server}
                                    />
                                    <HealthGauge
                                        label="OS Memory"
                                        value={health.os.usedMemoryPercent}
                                        max={100}
                                        unit="%"
                                        icon={Cpu}
                                    />
                                </>
                            ) : (
                                <div className="text-center text-muted-foreground py-4">Loading health metrics...</div>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Auto-refreshes every 10 seconds
                    </p>
                </TabsContent>

                {/* Error Log Tab */}
                <TabsContent value="error-log" className="space-y-4">
                    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                        <div className="section-header flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Error Log ({errors?.pagination.totalRows ?? 0} total)
                        </div>
                        <div className="p-0">
                            {errors && errors.data.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[30px]"></TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Path</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Message</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {errors.data.map((error) => (
                                            <>
                                                <TableRow
                                                    key={error.id}
                                                    className="cursor-pointer"
                                                    onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                                                >
                                                    <TableCell>
                                                        {expandedError === error.id
                                                            ? <ChevronUp className="h-4 w-4" />
                                                            : <ChevronDown className="h-4 w-4" />
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-xs whitespace-nowrap">
                                                        {new Date(error.createdDate).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`text-xs ${METHOD_COLORS[error.method] || ''}`}>
                                                            {error.method}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">{error.path}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="destructive" className="text-xs">{error.statusCode}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm max-w-[300px] truncate">{error.errorMessage}</TableCell>
                                                </TableRow>
                                                {expandedError === error.id && error.stackTrace && (
                                                    <TableRow key={`${error.id}-stack`}>
                                                        <TableCell colSpan={6}>
                                                            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-48 whitespace-pre-wrap">
                                                                {error.stackTrace}
                                                            </pre>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    No errors logged
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Pagination */}
                    {errors && errors.pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setErrorPage(p => Math.max(1, p - 1))}
                                disabled={errorPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm flex items-center px-3">
                                Page {errorPage} of {errors.pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setErrorPage(p => Math.min(errors.pagination.totalPages, p + 1))}
                                disabled={errorPage === errors.pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
