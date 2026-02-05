import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Machine } from '@/types/maintenance';
import { toast } from 'sonner';

export const useMachines = () => {
    const queryClient = useQueryClient();

    // Fetch all machines
    const useGetMachines = () => {
        return useQuery({
            queryKey: ['machines'],
            queryFn: () => api.get<Machine[]>('/machines'),
        });
    };

    // Fetch single machine
    const useGetMachine = (id: string | number) => {
        return useQuery({
            queryKey: ['machines', id],
            queryFn: () => api.get<Machine>(`/machines/${id}`),
            enabled: !!id,
        });
    };

    // Create machine
    const useCreateMachine = () => {
        return useMutation({
            mutationFn: (data: Partial<Machine>) => api.post<Machine>('/machines', data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['machines'] });
                toast.success('Machine created successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to create machine: ${error.message}`);
            },
        });
    };

    // Update machine
    const useUpdateMachine = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: string | number; data: Partial<Machine> }) =>
                api.put<Machine>(`/machines/${id}`, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['machines'] });
                toast.success('Machine updated successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update machine: ${error.message}`);
            },
        });
    };

    // Delete machine
    const useDeleteMachine = () => {
        return useMutation({
            mutationFn: (id: string | number) => api.delete(`/machines/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['machines'] });
                toast.success('Machine deleted successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete machine: ${error.message}`);
            },
        });
    };

    return {
        useGetMachines,
        useGetMachine,
        useCreateMachine,
        useUpdateMachine,
        useDeleteMachine,
    };
};
