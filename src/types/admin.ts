// =============================================
// Admin Panel Types
// =============================================

// Database Explorer
export interface TableInfo {
    name: string;
    rowCount: number;
}

export interface TableColumn {
    name: string;
    dataType: string;
    maxLength: number | null;
    isNullable: boolean;
    defaultValue: string | null;
    isPrimaryKey: boolean;
    isIdentity: boolean;
}

export interface TableConstraint {
    name: string;
    type: string;
    column: string;
}

export interface TableIndex {
    name: string;
    type: string;
    isUnique: boolean;
    columns: string;
}

export interface TableSchema {
    tableName: string;
    columns: TableColumn[];
    constraints: TableConstraint[];
    indexes: TableIndex[];
}

export interface TableDataResponse {
    tableName: string;
    columns: string[];
    data: Record<string, any>[];
    pagination: PaginationInfo;
}

export interface PaginationInfo {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
}

// Monitoring
export interface AdminOverview {
    totalUsers: number;
    totalMachines: number;
    totalNCs: number;
    totalActions: number;
    totalSpareParts: number;
    totalRecords: number;
    requestsToday: number;
    errorsToday: number;
    serverUptime: number;
    serverUptimeFormatted: string;
}

export interface ApiActivityStat {
    method: string;
    path: string;
    requestCount: number;
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
}

export interface ApiTimelineEntry {
    hour: string;
    requestCount: number;
    avgResponseTime: number;
    errorCount: number;
}

export interface SystemHealth {
    server: {
        uptime: number;
        uptimeFormatted: string;
        nodeVersion: string;
        platform: string;
        pid: number;
    };
    memory: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        heapUsedPercent: number;
        rssMB: number;
        heapUsedMB: number;
        heapTotalMB: number;
    };
    os: {
        totalMemory: number;
        freeMemory: number;
        usedMemoryPercent: number;
        cpus: number;
        loadAvg: number[];
    };
    cpu: {
        user: number;
        system: number;
    };
    database: {
        size: number;
        available: number;
        pending: number;
        borrowed: number;
    };
}

export interface ErrorLogEntry {
    id: number;
    path: string;
    method: string;
    errorMessage: string;
    stackTrace: string | null;
    statusCode: number;
    createdDate: string;
}

export interface ActivityLogEntry {
    id: number;
    method: string;
    path: string;
    statusCode: number;
    responseTimeMs: number;
    ipAddress: string | null;
    createdDate: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationInfo;
}

// User Management
export interface AdminUser {
    id: number;
    name: string;
    email: string | null;
    department: string | null;
    role: 'ADMIN' | 'USER' | 'VIEWER';
    isActive: boolean;
    createdDate: string;
    updatedDate: string;
}
