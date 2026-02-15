import { useState } from 'react';
import {
    ScrollText,
    ChevronLeft,
    ChevronRight,
    Filter,
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
import { useAdmin } from '@/hooks/useAdmin';

const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-success/15 text-success',
    POST: 'bg-primary/15 text-primary',
    PUT: 'bg-warning/15 text-warning',
    DELETE: 'bg-destructive/15 text-destructive',
};

function getStatusColor(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return 'bg-success/15 text-success';
    if (statusCode >= 300 && statusCode < 400) return 'bg-primary/15 text-primary';
    if (statusCode >= 400 && statusCode < 500) return 'bg-warning/15 text-warning';
    if (statusCode >= 500) return 'bg-destructive/15 text-destructive';
    return 'bg-muted text-muted-foreground';
}

function getResponseTimeColor(ms: number): string {
    if (ms < 100) return 'text-success';
    if (ms < 500) return 'text-warning';
    return 'text-destructive';
}

export default function ActivityLogs() {
    const { useActivityLog } = useAdmin();

    const [page, setPage] = useState(1);
    const [methodFilter, setMethodFilter] = useState<string>('ALL');

    const method = methodFilter === 'ALL' ? undefined : methodFilter;
    const { data: logs, isLoading } = useActivityLog(page, 50, method);

    const handleMethodChange = (value: string) => {
        setMethodFilter(value);
        setPage(1);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="page-header inline-block">
                ACTIVITY LOGS
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter by method:</span>
                    <Select value={methodFilter} onValueChange={handleMethodChange}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Methods</SelectItem>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {logs && (
                    <span className="text-sm text-muted-foreground">
                        {logs.pagination.totalRows} total requests
                    </span>
                )}
            </div>

            {/* Logs Table */}
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="section-header flex items-center gap-2">
                    <ScrollText className="h-4 w-4" />
                    API Request Log
                </div>
                <div className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading activity logs...</div>
                    ) : logs && logs.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Path</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Response Time</TableHead>
                                    <TableHead>IP Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                            {new Date(log.createdDate).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs font-mono ${METHOD_COLORS[log.method] || ''}`}>
                                                {log.method}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm max-w-[300px] truncate">
                                            {log.path}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={`text-xs ${getStatusColor(log.statusCode)}`}>
                                                {log.statusCode}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-mono text-sm ${getResponseTimeColor(log.responseTimeMs)}`}>
                                            {log.responseTimeMs}ms
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {log.ipAddress || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            No activity logs recorded yet
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {logs && logs.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((page - 1) * 50) + 1}-{Math.min(page * 50, logs.pagination.totalRows)} of {logs.pagination.totalRows}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            Page {page} of {logs.pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(logs.pagination.totalPages, p + 1))}
                            disabled={page === logs.pagination.totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
