import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { OverviewDashboardData } from '@/types/dashboards';
import { useEntityId } from '@/contexts/EntityContext';

export interface SidebarBadges {
  spareParts?: number;
  openTickets?: number;
}

export function useSidebarBadges(enabled: boolean) {
  const entityId = useEntityId();
  const { data } = useQuery({
    queryKey: ['sidebar-badges', { entityId }],
    queryFn: () => api.get<OverviewDashboardData>('/dashboards/overview'),
    staleTime: 120000, // 2 min
    enabled,
  });

  const badges: SidebarBadges = {};
  if (data?.kpis) {
    if (data.kpis.criticalSpareParts > 0) badges.spareParts = data.kpis.criticalSpareParts;
    if ((data.kpis as Record<string, number>).openSupportTickets > 0) badges.openTickets = (data.kpis as Record<string, number>).openSupportTickets;
  }

  return badges;
}
