export interface Machine {
  id: string;
  finalCode: string;
  type: string;
  group: string;
  description: string;
  purchasingDate: string;
  purchasingCost: string;
  poNumber: string;
  area: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  manufacturerYear: string;
  power: string;
  permissionRequired: boolean;
  authorizationGroup: string;
  maintenanceNeeded: boolean;
  maintenanceOnHold: boolean;
  personInChargeID?: string | null;
  personInCharge: string;
  imageUrl?: string;
}

export interface MaintenanceAction {
  id: string;
  machineId: string;
  action: string;
  periodicity: 'BEFORE EACH USE' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  timeNeeded: number;
  maintenanceInCharge: boolean;
  status: 'IDEAL' | 'MANDATORY';
  month?: string;
}

export interface NonConformity {
  id: string;
  ncCode: string;
  machineId: string;
  area: string;
  maintenanceOperator: string;
  creationDate: string;
  initiationDate: string;
  finishDate?: string;
  status: 'PENDING' | 'IN PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: number;
  category?: string;
}

export interface NCComment {
  id: string;
  ncId: string;
  date: string;
  comment: string;
  operator?: string;
}

export interface SparePart {
  id: string;
  machineId: string;
  description: string;
  reference: string;
  quantity: number;
  link: string;
}

export interface AuthorizationMatrix {
  id: string;
  operatorId?: string;
  operatorName: string;
  email?: string;
  department?: string;
  updatedDate: string;
  authorizations: Record<string, boolean>;
  defaultShiftId?: string | null;
  defaultShiftName?: string | null;
}

export interface ListOption {
  id: string;
  listType: string;
  value: string;
}

export interface MaintenanceExecution {
  id: string;
  actionId: string;
  machineId: string;
  scheduledDate: string;
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  actualTime: number | null;
  completedById: string | null;
  completedByName: string | null;
  completedDate: string | null;
  notes: string | null;
}

export interface ExecutionStats {
  actionId: string;
  totalCompleted: number;
  totalSkipped: number;
  totalRecords: number;
  totalPlanned: number;
  lastCompletedDate: string | null;
  avgActualTime: number | null;
  completionRate: number;
}

export interface Operator {
  id: string;
  operatorName: string;
  email: string;
  department: string;
}

export interface MaintenanceSummaryRow {
  machineId: string;
  finalCode: string;
  description: string;
  area: string;
  efficiency: number;       // 0-100, or -1 for N/A
  weeklyData: number[];     // 48 elements: 0=red, 1=green, 2=yellow, -1=neutral
}

export interface MachineDocument {
  id: string;
  machineId: string;
  fileName: string;
  storedName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category: 'DOCUMENT' | 'MANUAL';
  uploadedDate: string;
}
