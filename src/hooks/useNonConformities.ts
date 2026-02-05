import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { NonConformity, NCComment } from '@/types/maintenance';
import { toast } from 'sonner';

export const useNonConformities = () => {
    const queryClient = useQueryClient();

    const useGetNCs = (machineId?: string) => {
        return useQuery({
            queryKey: ['non-conformities', { machineId }],
            queryFn: () => api.get<NonConformity[]>(machineId ? `/non-conformities?machineId=${machineId}` : '/non-conformities'),
        });
    };

    const useGetNC = (id: string | number) => {
        return useQuery({
            queryKey: ['non-conformities', id],
            queryFn: () => api.get<NonConformity>(`/non-conformities/${id}`),
            enabled: !!id,
        });
    };

    const useCreateNC = () => {
        return useMutation({
            mutationFn: (data: Partial<NonConformity>) => api.post<NonConformity>('/non-conformities', data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['non-conformities'] });
                toast.success('Non-conformity created successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to create NC: ${error.message}`);
            },
        });
    };

    const useUpdateNC = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: string | number; data: Partial<NonConformity> }) =>
                api.put<NonConformity>(`/non-conformities/${id}`, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['non-conformities'] });
                toast.success('Non-conformity updated successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update NC: ${error.message}`);
            },
        });
    };

    const useDeleteNC = () => {
        return useMutation({
            mutationFn: (id: string | number) => api.delete(`/non-conformities/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['non-conformities'] });
                toast.success('Non-conformity deleted');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete NC: ${error.message}`);
            },
        });
    };

    // NC Comments
    const useGetNCComments = (ncId: string | number) => {
        return useQuery({
            queryKey: ['nc-comments', ncId],
            queryFn: () => api.get<NCComment[]>(`/nc-comments?ncId=${ncId}`),
            enabled: !!ncId,
        });
    };

    const useAddComment = () => {
        return useMutation({
            mutationFn: (data: Partial<NCComment>) => api.post<NCComment>('/nc-comments', data),
            onSuccess: (_, variables) => {
                queryClient.invalidateQueries({ queryKey: ['nc-comments', variables.ncId] });
                toast.success('Comment added');
            },
        });
    };

    const useUpdateComment = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: string | number; data: Partial<NCComment> }) =>
                api.put<NCComment>(`/nc-comments/${id}`, data),
            onSuccess: (_, variables) => {
                queryClient.invalidateQueries({ queryKey: ['nc-comments'] });
                toast.success('Comment updated');
            },
        });
    };

    const useDeleteComment = () => {
        return useMutation({
            mutationFn: (id: string | number) => api.delete(`/nc-comments/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['nc-comments'] });
                toast.success('Comment deleted');
            },
        });
    };

    return {
        useGetNCs,
        useGetNC,
        useCreateNC,
        useUpdateNC,
        useDeleteNC,
        useGetNCComments,
        useAddComment,
        useUpdateComment,
        useDeleteComment,
    };
};
