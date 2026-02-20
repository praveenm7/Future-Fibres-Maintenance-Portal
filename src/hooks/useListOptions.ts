import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { ListOption } from '@/types/maintenance';
import { toast } from 'sonner';

export const useListOptions = () => {
    const queryClient = useQueryClient();

    const useGetListOptions = (listType?: string) => {
        return useQuery({
            queryKey: ['list-options', listType],
            queryFn: () => api.get<ListOption[]>(listType ? `/list-options?listType=${listType}` : '/list-options'),
        });
    };

    const useCreateListOption = () => {
        return useMutation({
            mutationFn: (data: Partial<ListOption>) => api.post<ListOption>('/list-options', data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['list-options'] });
                toast.success('List item added successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to add list item: ${error.message}`);
            },
        });
    };

    const useUpdateListOption = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: string | number; data: Partial<ListOption> }) =>
                api.put<ListOption>(`/list-options/${id}`, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['list-options'] });
                toast.success('List item updated successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update list item: ${error.message}`);
            },
        });
    };

    const useDeleteListOption = () => {
        return useMutation({
            mutationFn: (id: string | number) => api.delete(`/list-options/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['list-options'] });
                toast.success('List item deleted successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete list item: ${error.message}`);
            },
        });
    };

    return {
        useGetListOptions,
        useCreateListOption,
        useUpdateListOption,
        useDeleteListOption,
    };
};
