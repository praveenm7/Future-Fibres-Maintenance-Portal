import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { MaintenanceAction } from '@/types/maintenance';
import { toast } from 'sonner';
import { useEntityId } from '@/contexts/EntityContext';

export const useMaintenanceActions = () => {
    const queryClient = useQueryClient();
    const entityId = useEntityId();

    const useGetActions = (machineId?: string | number) => {
        const endpoint = machineId ? `/maintenance-actions?machineId=${machineId}` : '/maintenance-actions';
        return useQuery({
            queryKey: ['maintenance-actions', machineId, { entityId }],
            queryFn: () => api.get<MaintenanceAction[]>(endpoint),
        });
    };

    const useCreateAction = () => {
        return useMutation({
            mutationFn: (data: Partial<MaintenanceAction>) => api.post<MaintenanceAction>('/maintenance-actions', data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['maintenance-actions'] });
                toast.success('Maintenance action created successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to create action: ${error.message}`);
            },
        });
    };

    const useUpdateAction = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: string | number; data: Partial<MaintenanceAction> }) =>
                api.put<MaintenanceAction>(`/maintenance-actions/${id}`, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['maintenance-actions'] });
                toast.success('Maintenance action updated successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update action: ${error.message}`);
            },
        });
    };

    const useDeleteAction = () => {
        return useMutation({
            mutationFn: (id: string | number) => api.delete(`/maintenance-actions/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['maintenance-actions'] });
                toast.success('Maintenance action deleted successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete action: ${error.message}`);
            },
        });
    };

    return {
        useGetActions,
        useCreateAction,
        useUpdateAction,
        useDeleteAction,
    };
};
