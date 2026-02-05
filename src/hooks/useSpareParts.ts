import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { SparePart } from '@/types/maintenance';
import { toast } from 'sonner';

export const useSpareParts = () => {
    const queryClient = useQueryClient();

    const useGetParts = (machineId?: string) => {
        return useQuery({
            queryKey: ['spare-parts', { machineId }],
            queryFn: () => api.get<SparePart[]>(machineId ? `/spare-parts?machineId=${machineId}` : '/spare-parts'),
        });
    };

    const useGetPart = (id: string | number) => {
        return useQuery({
            queryKey: ['spare-parts', id],
            queryFn: () => api.get<SparePart>(`/spare-parts/${id}`),
            enabled: !!id,
        });
    };

    const useCreatePart = () => {
        return useMutation({
            mutationFn: (data: Partial<SparePart>) => api.post<SparePart>('/spare-parts', data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
                toast.success('Spare part added successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to add part: ${error.message}`);
            },
        });
    };

    const useUpdatePart = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: string | number; data: Partial<SparePart> }) =>
                api.put<SparePart>(`/spare-parts/${id}`, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
                toast.success('Spare part updated successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update part: ${error.message}`);
            },
        });
    };

    const useDeletePart = () => {
        return useMutation({
            mutationFn: (id: string | number) => api.delete(`/spare-parts/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
                toast.success('Spare part deleted successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete part: ${error.message}`);
            },
        });
    };

    return {
        useGetParts,
        useGetPart,
        useCreatePart,
        useUpdatePart,
        useDeletePart,
    };
};
