import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useDashboard = () => {
    const useGetStats = () => {
        return useQuery({
            queryKey: ['dashboard', 'stats'],
            queryFn: () => api.get<any>('/dashboard/stats'),
        });
    };

    const useGetMaintenanceReport = (periodicity: string = 'WEEKLY') => {
        return useQuery({
            queryKey: ['dashboard', 'report', periodicity],
            queryFn: () => api.get<any[]>(`/dashboard/maintenance-report?periodicity=${periodicity}`),
        });
    };

    return {
        useGetStats,
        useGetMaintenanceReport,
    };
};
