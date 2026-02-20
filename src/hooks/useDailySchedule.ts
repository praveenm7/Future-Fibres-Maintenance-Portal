import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { DailySchedule, ScheduleConfig } from '@/types/schedule';

export function useDailySchedule(date: string, config: Partial<ScheduleConfig> = {}) {
    const params = new URLSearchParams({ date });
    if (config.breakDuration != null) params.set('breakDuration', config.breakDuration.toString());
    if (config.bufferMinutes != null) params.set('buffer', config.bufferMinutes.toString());
    if (config.groupByMachine != null) params.set('groupByMachine', config.groupByMachine.toString());
    if (config.prioritizeMandatory != null) params.set('prioritizeMandatory', config.prioritizeMandatory.toString());

    return useQuery({
        queryKey: ['daily-schedule', date, config],
        queryFn: () => api.get<DailySchedule>(`/schedule/daily?${params.toString()}`),
        enabled: !!date,
        staleTime: 2 * 60 * 1000,
    });
}
