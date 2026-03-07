import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useEntityId } from '@/contexts/EntityContext';
import type {
    DashboardFilters,
    OverviewDashboardData,
    ExecutionSummaryData,
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
    const entityId = useEntityId();

    const useOverview = () => {
        return useQuery({
            queryKey: ['dashboards', 'overview', { entityId }],
            queryFn: () => api.get<OverviewDashboardData>('/dashboards/overview'),
            staleTime: 60000,
        });
    };

    const useEquipmentHealth = (filters?: DashboardFilters) => {
        return useQuery({
            queryKey: ['dashboards', 'equipment-health', filters?.area, filters?.machineType, { entityId }],
            queryFn: () => api.get<EquipmentHealthDashboardData>(
                `/dashboards/equipment-health${buildFilterParams(filters)}`
            ),
            staleTime: 60000,
        });
    };

    const useSparePartsAnalytics = (filters?: DashboardFilters) => {
        return useQuery({
            queryKey: ['dashboards', 'spare-parts', filters?.area, filters?.machineType, { entityId }],
            queryFn: () => api.get<SparePartsDashboardData>(
                `/dashboards/spare-parts${buildFilterParams(filters)}`
            ),
            staleTime: 60000,
        });
    };

    const useExecutionSummary = (filters?: DashboardFilters) => {
        return useQuery({
            queryKey: ['dashboards', 'execution-summary', filters?.area, filters?.machineType, { entityId }],
            queryFn: () => api.get<ExecutionSummaryData>(
                `/dashboards/execution-summary${buildFilterParams(filters)}`
            ),
            staleTime: 60000,
        });
    };

    const useWorkforce = () => {
        return useQuery({
            queryKey: ['dashboards', 'workforce', { entityId }],
            queryFn: () => api.get<WorkforceDashboardData>('/dashboards/workforce'),
            staleTime: 60000,
        });
    };

    return {
        useOverview,
        useExecutionSummary,
        useEquipmentHealth,
        useSparePartsAnalytics,
        useWorkforce,
    };
};
