import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { OverviewDashboardData } from '@/types/dashboards';

export interface SidebarBadges {
  nonConformities?: number;
  spareParts?: number;
}

export function useSidebarBadges(enabled: boolean) {
  const { data } = useQuery({
    queryKey: ['sidebar-badges'],
    queryFn: () => api.get<OverviewDashboardData>('/dashboards/overview'),
    staleTime: 120000, // 2 min
    enabled,
  });

  const badges: SidebarBadges = {};
  if (data?.kpis) {
    if (data.kpis.activeNCs > 0) badges.nonConformities = data.kpis.activeNCs;
    if (data.kpis.criticalSpareParts > 0) badges.spareParts = data.kpis.criticalSpareParts;
  }

  return badges;
}
