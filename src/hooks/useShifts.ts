import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Shift, OperatorRosterEntry } from '@/types/schedule';

/** Fetch all active shift definitions */
export function useShifts() {
    return useQuery({
        queryKey: ['shifts'],
        queryFn: () => api.get<Shift[]>('/shifts'),
    });
}

/** Fetch the effective shift roster for all operators on a given date */
export function useShiftRoster(date: string) {
    return useQuery({
        queryKey: ['shift-roster', date],
        queryFn: () => api.get<OperatorRosterEntry[]>(`/shifts/roster?date=${date}`),
        enabled: !!date,
    });
}

/** Set an operator's default shift */
export function useSetDefaultShift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ operatorId, shiftId }: { operatorId: string; shiftId: string | null }) =>
            api.put(`/shifts/operators/${operatorId}/default`, { shiftId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shift-roster'] });
            queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
            queryClient.invalidateQueries({ queryKey: ['operators'] });
        },
    });
}

/** Create or update a shift override for a specific date */
export function useSetShiftOverride() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ operatorId, date, shiftId }: { operatorId: string; date: string; shiftId: string | null }) =>
            api.post('/shifts/overrides', { operatorId, date, shiftId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shift-roster'] });
            queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
        },
    });
}

/** Remove a shift override (revert to default) */
export function useRemoveShiftOverride() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ operatorId, date }: { operatorId: string; date: string }) =>
            api.delete(`/shifts/overrides?operatorId=${operatorId}&date=${date}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shift-roster'] });
            queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
        },
    });
}
