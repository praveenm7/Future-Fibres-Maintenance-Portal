import { useState, useCallback, useMemo } from 'react';
import { CalendarEvent, Periodicity } from './calendarUtils';

export interface CalendarFilterState {
  area: string | null;
  machineIds: string[];
  periodicities: Periodicity[];
  status: 'ALL' | 'IDEAL' | 'MANDATORY';
  maintenanceInCharge: 'all' | 'yes' | 'no';
}

const INITIAL_FILTERS: CalendarFilterState = {
  area: null,
  machineIds: [],
  periodicities: [],
  status: 'ALL',
  maintenanceInCharge: 'all',
};

export function useCalendarFilters() {
  const [filters, setFilters] = useState<CalendarFilterState>(INITIAL_FILTERS);

  const setFilter = useCallback(
    <K extends keyof CalendarFilterState>(
      key: K,
      value: CalendarFilterState[K]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.area !== null ||
      filters.machineIds.length > 0 ||
      filters.periodicities.length > 0 ||
      filters.status !== 'ALL' ||
      filters.maintenanceInCharge !== 'all'
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.area) count++;
    if (filters.machineIds.length > 0) count++;
    if (filters.periodicities.length > 0) count++;
    if (filters.status !== 'ALL') count++;
    if (filters.maintenanceInCharge !== 'all') count++;
    return count;
  }, [filters]);

  const applyFilters = useCallback(
    (events: CalendarEvent[]): CalendarEvent[] => {
      if (!hasActiveFilters) return events;

      return events.filter((event) => {
        if (filters.area && event.machine.area !== filters.area) return false;

        if (
          filters.machineIds.length > 0 &&
          !filters.machineIds.includes(event.machine.id)
        )
          return false;

        if (
          filters.periodicities.length > 0 &&
          !filters.periodicities.includes(
            event.action.periodicity as Periodicity
          )
        )
          return false;

        if (filters.status !== 'ALL' && event.action.status !== filters.status)
          return false;

        if (
          filters.maintenanceInCharge === 'yes' &&
          !event.action.maintenanceInCharge
        )
          return false;
        if (
          filters.maintenanceInCharge === 'no' &&
          event.action.maintenanceInCharge
        )
          return false;

        return true;
      });
    },
    [filters, hasActiveFilters]
  );

  return {
    filters,
    setFilter,
    clearFilters,
    applyFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}
