import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function useSaveTaskOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ date, overrides }: { date: string; overrides: { actionId: number; sortPosition: number }[] }) =>
            api.post('/schedule/task-order', { date, overrides }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
            queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
            toast.success('Task order saved');
        },
        onError: (error: Error) => {
            toast.error(`Failed to save task order: ${error.message}`);
        },
    });
}

export function useResetTaskOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (date: string) => api.delete(`/schedule/task-order?date=${date}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
            queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
            toast.success('Task order reset to default');
        },
        onError: (error: Error) => {
            toast.error(`Failed to reset task order: ${error.message}`);
        },
    });
}
