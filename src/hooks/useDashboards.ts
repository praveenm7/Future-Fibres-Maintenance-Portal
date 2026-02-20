import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type {
    DashboardFilters,
    OverviewDashboardData,
    ExecutionSummaryData,
    NCAnalyticsDashboardData,
    EquipmentHealthDashboardData,
    SparePartsDashboardData,
    WorkforceDashboardData,
} from '@/types/dashboards';

const buildFilterParams = (filters?: DashboardFilters): string => {
    if (!filters) return '';
    const params = new URLSearchParams();
    if (filters.area) params.set('area', filters.area);
    if (filters.machineType) params.set('type', filters.machineType);
    const str = params.toString();
    return str ? `?${str}` : '';
};

export const useDashboards = () => {
    const useOverview = () => {
        return useQuery({
            queryKey: ['dashboards', 'overview'],
            queryFn: () => api.get<OverviewDashboardData>('/dashboards/overview'),
            staleTime: 60000,
        });
    };

    const useNCAnalytics = (filters?: DashboardFilters) => {
        return useQuery({
            queryKey: ['dashboards', 'nc-analytics', filters?.area, filters?.machineType],
            queryFn: () => api.get<NCAnalyticsDashboardData>(
                `/dashboards/nc-analytics${buildFilterParams(filters)}`
            ),
            staleTime: 60000,
        });
    };

    const useEquipmentHealth = (filters?: DashboardFilters) => {
        return useQuery({
            queryKey: ['dashboards', 'equipment-health', filters?.area, filters?.machineType],
            queryFn: () => api.get<EquipmentHealthDashboardData>(
                `/dashboards/equipment-health${buildFilterParams(filters)}`
            ),
            staleTime: 60000,
        });
    };

    const useSparePartsAnalytics = (filters?: DashboardFilters) => {
        return useQuery({
            queryKey: ['dashboards', 'spare-parts', filters?.area, filters?.machineType],
            queryFn: () => api.get<SparePartsDashboardData>(
                `/dashboards/spare-parts${buildFilterParams(filters)}`
            ),
            staleTime: 60000,
        });
    };

    const useExecutionSummary = (filters?: DashboardFilters) => {
        return useQuery({
            queryKey: ['dashboards', 'execution-summary', filters?.area, filters?.machineType],
            queryFn: () => api.get<ExecutionSummaryData>(
                `/dashboards/execution-summary${buildFilterParams(filters)}`
            ),
            staleTime: 60000,
        });
    };

    const useWorkforce = () => {
        return useQuery({
            queryKey: ['dashboards', 'workforce'],
            queryFn: () => api.get<WorkforceDashboardData>('/dashboards/workforce'),
            staleTime: 60000,
        });
    };

    return {
        useOverview,
        useExecutionSummary,
        useNCAnalytics,
        useEquipmentHealth,
        useSparePartsAnalytics,
        useWorkforce,
    };
};
