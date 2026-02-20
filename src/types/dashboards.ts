// =============================================
// Dashboard Analytics Types
// =============================================

export interface DashboardFilters {
    area?: string;
    machineType?: string;
}

// --- Overview Dashboard ---

export interface OverviewKPIs {
    totalMachines: number;
    machinesNeedingMaintenance: number;
    activeNCs: number;
    overdueNCs: number;
    criticalSpareParts: number;
    complianceRate: number;
}

export interface OverviewDashboardData {
    kpis: OverviewKPIs;
    ncStatusDistribution: Array<{ status: string; count: number }>;
    machinesByArea: Array<{ area: string; count: number }>;
    ncMonthlyTrend: Array<{ month: string; count: number }>;
    maintenanceByPeriodicity: Array<{
        periodicity: string;
        idealCount: number;
        mandatoryCount: number;
    }>;
}

// --- NC Analytics Dashboard ---

export interface NCAnalyticsKPIs {
    totalNCs: number;
    openNCs: number;
    avgResolutionDays: number | null;
    ncsThisMonth: number;
    highPriorityOpen: number;
    completionRate: number;
}

export interface NCAnalyticsDashboardData {
    kpis: NCAnalyticsKPIs;
    ncsByStatus: Array<{ status: string; count: number }>;
    monthlyTrendByCategory: Array<{ month: string; category: string; count: number }>;
    priorityDistribution: Array<{ priority: number; count: number }>;
    avgResolutionByArea: Array<{ area: string; avgDays: number; completedCount: number }>;
    topMachinesByNCs: Array<{ finalCode: string; description: string; ncCount: number }>;
}

// --- Equipment Health Dashboard ---

export interface EquipmentHealthKPIs {
    totalMachines: number;
    machinesWithPlans: number;
    machinesOnHold: number;
    avgMachineAge: number | null;
    machinesWithoutPlans: number;
}

export interface EquipmentHealthDashboardData {
    kpis: EquipmentHealthKPIs;
    machineTypeDistribution: Array<{ type: string; count: number }>;
    machinesByGroup: Array<{ group: string; count: number }>;
    maintenanceActionsBreakdown: Array<{
        periodicity: string;
        idealCount: number;
        mandatoryCount: number;
    }>;
    ageDistribution: Array<{ bracket: string; count: number }>;
}

// --- Execution Summary (for Overview Dashboard) ---

export interface ExecutionSummaryKPIs {
    completedThisMonth: number;
    plannedThisMonth: number;
    totalThisMonth: number;
    completionRate: number;
    avgTimeVariance: number | null;
}

export interface ExecutionSummaryData {
    kpis: ExecutionSummaryKPIs;
    completionTrend: Array<{ month: string; completed: number; total: number; planned: number }>;
}

// --- Spare Parts Dashboard ---

export interface SparePartsKPIs {
    totalPartTypes: number;
    outOfStock: number;
    lowStock: number;
    totalUnits: number;
    machinesWithParts: number;
}

export interface SparePartsDashboardData {
    kpis: SparePartsKPIs;
    stockDistribution: Array<{ level: string; count: number }>;
    topMachinesByParts: Array<{ finalCode: string; description: string; partCount: number }>;
    partsPerArea: Array<{ area: string; totalQuantity: number }>;
    outOfStockItems: Array<{
        machineCode: string;
        machineDescription: string;
        partDescription: string;
        reference: string;
    }>;
}

// --- Workforce Dashboard ---

export interface WorkforceKPIs {
    activeOperators: number;
    operatorsWithAuthorizations: number;
    avgNCsPerOperator: number | null;
    unassignedMachines: number;
    departmentsCount: number;
}

export interface WorkforceDashboardData {
    kpis: WorkforceKPIs;
    ncWorkloadByOperator: Array<{ operatorName: string; ncCount: number }>;
    operatorsByDepartment: Array<{ department: string; count: number }>;
    authorizationCoverage: Array<{ operatorName: string; authorizedGroups: number }>;
    operatorPerformance: Array<{
        operatorName: string;
        totalAssigned: number;
        completed: number;
    }>;
}
