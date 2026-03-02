export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus = 'SUBMITTED' | 'APPROVED' | 'ASSIGNED' | 'IN PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface SupportTicket {
    id: string;
    ticketCode: string;
    machineId: string | null;
    machineCode: string | null;
    machineDescription: string | null;
    title: string;
    description: string | null;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    submittedById: string | null;
    submittedByName: string | null;
    assignedToId: string | null;
    assignedToName: string | null;
    approvedById: string | null;
    approvedByName: string | null;
    dueDate: string | null;
    resolvedDate: string | null;
    closedDate: string | null;
    resolutionNotes: string | null;
    commentCount: number;
    attachmentCount: number;
    isOverdue: boolean;
    createdDate: string;
    updatedDate: string;
}

export interface TicketComment {
    id: string;
    ticketId: string | null;
    comment: string;
    operatorId: string | null;
    operatorName: string | null;
    isStatusChange: boolean;
    commentDate: string;
    createdDate: string;
}

export interface TicketAttachment {
    id: string;
    ticketId: string;
    fileName: string;
    storedName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedById: string | null;
    uploadedByName: string | null;
    uploadedDate: string;
}

export interface SupportDashboardKPIs {
    openTickets: number;
    overdueTickets: number;
    avgResolutionDays: number | null;
    criticalOpen: number;
    ticketsThisMonth: number;
    resolutionRate: number;
}

export interface SupportDashboardData {
    kpis: SupportDashboardKPIs;
    ticketsByStatus: Array<{ status: string; count: number }>;
    ticketsByPriority: Array<{ priority: string; count: number }>;
    ticketsByCategory: Array<{ category: string; count: number }>;
    topMachinesByTickets: Array<{ finalCode: string; description: string; ticketCount: number }>;
    monthlyTrend: Array<{ month: string; count: number }>;
}
