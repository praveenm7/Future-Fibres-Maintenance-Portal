import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { MaintenanceExecution, ExecutionStats } from '@/types/maintenance';
import { toast } from 'sonner';

export const useMaintenanceExecutions = () => {
    const queryClient = useQueryClient();

    const useGetExecutions = (from: string, to: string) => {
        return useQuery({
            queryKey: ['maintenance-executions', from, to],
            queryFn: () => api.get<MaintenanceExecution[]>(`/maintenance-executions?from=${from}&to=${to}`),
            enabled: !!from && !!to,
        });
    };

    const useUpsertExecution = () => {
        return useMutation({
            mutationFn: (data: {
                actionId: string;
                machineId: string;
                scheduledDate: string;
                status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
                actualTime?: number | null;
                completedById?: string | null;
                notes?: string | null;
            }) => api.post<MaintenanceExecution>('/maintenance-executions', data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['maintenance-executions'] });
                queryClient.invalidateQueries({ queryKey: ['maintenance-execution-stats'] });
                queryClient.invalidateQueries({ queryKey: ['dashboards', 'execution-summary'] });
                queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
            },
            onError: (error: Error) => {
                toast.error(`Failed to update task: ${error.message}`);
            },
        });
    };

    const useUpdateExecution = () => {
        return useMutation({
            mutationFn: ({ id, data }: {
                id: string;
                data: Partial<Pick<MaintenanceExecution, 'status' | 'actualTime' | 'completedById' | 'notes'>>;
            }) => api.put<MaintenanceExecution>(`/maintenance-executions/${id}`, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['maintenance-executions'] });
                queryClient.invalidateQueries({ queryKey: ['maintenance-execution-stats'] });
                queryClient.invalidateQueries({ queryKey: ['dashboards', 'execution-summary'] });
            },
            onError: (error: Error) => {
                toast.error(`Failed to update task: ${error.message}`);
            },
        });
    };

    const useDeleteExecution = () => {
        return useMutation({
            mutationFn: (id: string) => api.delete(`/maintenance-executions/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['maintenance-executions'] });
                queryClient.invalidateQueries({ queryKey: ['maintenance-execution-stats'] });
                queryClient.invalidateQueries({ queryKey: ['dashboards', 'execution-summary'] });
                queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
            },
            onError: (error: Error) => {
                toast.error(`Failed to undo completion: ${error.message}`);
            },
        });
    };

    const useGetExecutionStats = (machineId?: string | number) => {
        const endpoint = machineId
            ? `/maintenance-executions/stats?machineId=${machineId}`
            : '/maintenance-executions/stats';
        return useQuery({
            queryKey: ['maintenance-execution-stats', machineId],
            queryFn: () => api.get<ExecutionStats[]>(endpoint),
            enabled: !!machineId,
        });
    };

    return {
        useGetExecutions,
        useGetExecutionStats,
        useUpsertExecution,
        useUpdateExecution,
        useDeleteExecution,
    };
};
