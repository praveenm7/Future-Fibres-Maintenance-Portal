import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import type {
    TableInfo,
    TableSchema,
    TableDataResponse,
    AdminOverview,
    ApiActivityStat,
    ApiTimelineEntry,
    SystemHealth,
    ErrorLogEntry,
    ActivityLogEntry,
    PaginatedResponse,
    AdminUser,
} from '@/types/admin';

export const useAdmin = () => {
    const queryClient = useQueryClient();

    // =============================================
    // ADMIN DASHBOARD
    // =============================================

    const useAdminOverview = () => {
        return useQuery({
            queryKey: ['admin', 'overview'],
            queryFn: () => api.get<AdminOverview>('/admin/metrics/overview'),
            refetchInterval: 30000, // Refresh every 30s
        });
    };

    // =============================================
    // DATABASE EXPLORER
    // =============================================

    const useDbTables = () => {
        return useQuery({
            queryKey: ['admin', 'db', 'tables'],
            queryFn: () => api.get<TableInfo[]>('/admin/db/tables'),
        });
    };

    const useDbTableSchema = (tableName: string) => {
        return useQuery({
            queryKey: ['admin', 'db', 'schema', tableName],
            queryFn: () => api.get<TableSchema>(`/admin/db/tables/${tableName}/schema`),
            enabled: !!tableName,
        });
    };

    const useDbTableData = (tableName: string, page: number = 1, pageSize: number = 50, search: string = '') => {
        return useQuery({
            queryKey: ['admin', 'db', 'data', tableName, page, pageSize, search],
            queryFn: () => api.get<TableDataResponse>(
                `/admin/db/tables/${tableName}/data?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`
            ),
            enabled: !!tableName,
        });
    };

    const useUpdateRow = () => {
        return useMutation({
            mutationFn: ({ tableName, rowId, data }: { tableName: string; rowId: string | number; data: Record<string, unknown> }) =>
                api.put(`/admin/db/tables/${tableName}/rows/${rowId}`, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['admin', 'db'] });
                toast.success('Row updated successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update row: ${error.message}`);
            },
        });
    };

    const useDeleteRow = () => {
        return useMutation({
            mutationFn: ({ tableName, rowId }: { tableName: string; rowId: string | number }) =>
                api.delete(`/admin/db/tables/${tableName}/rows/${rowId}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['admin', 'db'] });
                toast.success('Row deleted successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete row: ${error.message}`);
            },
        });
    };

    // =============================================
    // MONITORING
    // =============================================

    const useApiActivity = (hours: number = 24) => {
        return useQuery({
            queryKey: ['admin', 'api-activity', hours],
            queryFn: () => api.get<ApiActivityStat[]>(`/admin/metrics/api-activity?hours=${hours}`),
            refetchInterval: 30000,
        });
    };

    const useApiTimeline = (hours: number = 24) => {
        return useQuery({
            queryKey: ['admin', 'api-timeline', hours],
            queryFn: () => api.get<ApiTimelineEntry[]>(`/admin/metrics/api-timeline?hours=${hours}`),
            refetchInterval: 30000,
        });
    };

    const useSystemHealth = () => {
        return useQuery({
            queryKey: ['admin', 'system-health'],
            queryFn: () => api.get<SystemHealth>('/admin/metrics/system-health'),
            refetchInterval: 10000, // Refresh every 10s
        });
    };

    const useErrorLogs = (page: number = 1, pageSize: number = 20) => {
        return useQuery({
            queryKey: ['admin', 'errors', page, pageSize],
            queryFn: () => api.get<PaginatedResponse<ErrorLogEntry>>(`/admin/metrics/errors?page=${page}&pageSize=${pageSize}`),
        });
    };

    const useActivityLog = (page: number = 1, pageSize: number = 50, method?: string) => {
        return useQuery({
            queryKey: ['admin', 'activity-log', page, pageSize, method],
            queryFn: () => {
                let url = `/admin/metrics/activity-log?page=${page}&pageSize=${pageSize}`;
                if (method) url += `&method=${method}`;
                return api.get<PaginatedResponse<ActivityLogEntry>>(url);
            },
        });
    };

    // =============================================
    // USER MANAGEMENT
    // =============================================

    const useAdminUsers = () => {
        return useQuery({
            queryKey: ['admin', 'users'],
            queryFn: () => api.get<AdminUser[]>('/admin/users'),
        });
    };

    const useUpdateUserRole = () => {
        return useMutation({
            mutationFn: ({ id, role }: { id: number; role: string }) =>
                api.put(`/admin/users/${id}/role`, { role }),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
                toast.success('User role updated successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update role: ${error.message}`);
            },
        });
    };

    return {
        useAdminOverview,
        useDbTables,
        useDbTableSchema,
        useDbTableData,
        useUpdateRow,
        useDeleteRow,
        useApiActivity,
        useApiTimeline,
        useSystemHealth,
        useErrorLogs,
        useActivityLog,
        useAdminUsers,
        useUpdateUserRole,
    };
};
