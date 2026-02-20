import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { AuthorizationMatrix } from '@/types/maintenance';
import { toast } from 'sonner';

export const useAuthMatrix = () => {
    const queryClient = useQueryClient();

    const useGetMatrices = () => {
        return useQuery({
            queryKey: ['auth-matrix'],
            queryFn: () => api.get<AuthorizationMatrix[]>('/auth-matrix'),
        });
    };

    const useCreateMatrix = () => {
        return useMutation({
            mutationFn: (data: Partial<AuthorizationMatrix>) => api.post<AuthorizationMatrix>('/auth-matrix', data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['auth-matrix'] });
                queryClient.invalidateQueries({ queryKey: ['shift-roster'] });
                queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
                queryClient.invalidateQueries({ queryKey: ['operators'] });
                toast.success('Authorization created successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to create authorization: ${error.message}`);
            },
        });
    };

    const useUpdateMatrix = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: string | number; data: Partial<AuthorizationMatrix> }) =>
                api.put<AuthorizationMatrix>(`/auth-matrix/${id}`, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['auth-matrix'] });
                queryClient.invalidateQueries({ queryKey: ['shift-roster'] });
                queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
                queryClient.invalidateQueries({ queryKey: ['operators'] });
                toast.success('Authorization updated successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update authorization: ${error.message}`);
            },
        });
    };

    const useDeleteMatrix = () => {
        return useMutation({
            mutationFn: (id: string | number) => api.delete(`/auth-matrix/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['auth-matrix'] });
                toast.success('Authorization deleted');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete authorization: ${error.message}`);
            },
        });
    };

    return {
        useGetMatrices,
        useCreateMatrix,
        useUpdateMatrix,
        useDeleteMatrix,
    };
};
