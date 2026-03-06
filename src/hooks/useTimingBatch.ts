import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { TimingBatch, ScheduleConfig } from '@/types/schedule';

export function useTimingBatch(from: string, to: string, enabled: boolean, config: Partial<ScheduleConfig> = {}) {
    const params = new URLSearchParams({ from, to });
    if (config.breakDuration != null) params.set('breakDuration', config.breakDuration.toString());
    if (config.bufferMinutes != null) params.set('buffer', config.bufferMinutes.toString());
    if (config.groupByMachine != null) params.set('groupByMachine', config.groupByMachine.toString());
    if (config.prioritizeMandatory != null) params.set('prioritizeMandatory', config.prioritizeMandatory.toString());

    return useQuery({
        queryKey: ['timing-batch', from, to, config.breakDuration, config.bufferMinutes, config.groupByMachine, config.prioritizeMandatory],
        queryFn: () => api.get<TimingBatch>(`/schedule/timing-batch?${params.toString()}`),
        enabled: enabled && !!from && !!to,
        staleTime: 2 * 60 * 1000,
    });
}
