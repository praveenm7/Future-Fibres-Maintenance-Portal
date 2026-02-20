import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { MaintenanceSummaryRow } from '@/types/maintenance';

interface DashboardStats {
    totalMachines: number;
    machinesNeedingMaintenance: number;
    pendingNCs: number;
    inProgressNCs: number;
    totalMaintenanceActions: number;
    activeOperators: number;
}

interface MaintenanceReportRow {
    finalCode: string;
    machineDescription: string;
    area: string;
    action: string;
    periodicity: string;
    timeNeeded: number;
    status: string;
    personInCharge: string;
}

export const useDashboard = () => {
    const useGetStats = () => {
        return useQuery({
            queryKey: ['dashboard', 'stats'],
            queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
        });
    };

    const useGetMaintenanceReport = (periodicity: string = 'WEEKLY') => {
        return useQuery({
            queryKey: ['dashboard', 'report', periodicity],
            queryFn: () => api.get<MaintenanceReportRow[]>(`/dashboard/maintenance-report?periodicity=${periodicity}`),
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
