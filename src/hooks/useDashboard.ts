import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { MaintenanceSummaryRow } from '@/types/maintenance';

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

    const useGetMaintenanceSummary = (periodicity: string, year: number) => {
        return useQuery({
            queryKey: ['dashboard', 'summary', periodicity, year],
            queryFn: () => api.get<MaintenanceSummaryRow[]>(
                `/dashboard/maintenance-summary?periodicity=${periodicity}&year=${year}`
            ),
        });
    };

    return {
        useGetStats,
        useGetMaintenanceReport,
        useGetMaintenanceSummary,
    };
};
