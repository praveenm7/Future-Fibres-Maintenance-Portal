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
  status: 'IDEAL' | 'MANDATO RY';
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
  operatorName: string;
  updatedDate: string;
  authorizations: Record<string, boolean>;
}

export interface ListOption {
  id: string;
  listType: string;
  value: string;
}
