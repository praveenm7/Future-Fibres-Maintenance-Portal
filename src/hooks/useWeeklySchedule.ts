import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { WeeklySchedule, ScheduleConfig } from '@/types/schedule';
import { useEntityId } from '@/contexts/EntityContext';

export function useWeeklySchedule(enabled: boolean, config: Partial<ScheduleConfig> = {}) {
    const entityId = useEntityId();
    const params = new URLSearchParams();
    if (config.breakDuration != null) params.set('breakDuration', config.breakDuration.toString());
    if (config.bufferMinutes != null) params.set('buffer', config.bufferMinutes.toString());
    if (config.groupByMachine != null) params.set('groupByMachine', config.groupByMachine.toString());
    if (config.prioritizeMandatory != null) params.set('prioritizeMandatory', config.prioritizeMandatory.toString());

    return useQuery({
        queryKey: ['weekly-schedule', config.breakDuration, config.bufferMinutes, config.groupByMachine, config.prioritizeMandatory, { entityId }],
        queryFn: () => api.get<WeeklySchedule>(`/schedule/weekly?${params.toString()}`),
        enabled,
        staleTime: 2 * 60 * 1000,
    });
}
