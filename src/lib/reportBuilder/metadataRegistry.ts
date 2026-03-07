import type { TableMeta, FieldMeta, JoinMeta, ComputedFieldMeta } from '@/types/reportBuilder';

// ─── Helper to build FieldMeta from compact definition ───

function field(
  tableKey: string,
  dbColumn: string,
  label: string,
  dataType: FieldMeta['dataType'],
  opts: Partial<Pick<FieldMeta, 'filterable' | 'sortable' | 'aggregatable' | 'filterOptions'>> = {},
): FieldMeta {
  return {
    key: `${tableKey}.${dbColumn}`,
    dbColumn,
    label,
    dataType,
    filterable: opts.filterable ?? true,
    sortable: opts.sortable ?? true,
    aggregatable: opts.aggregatable ?? false,
    filterOptions: opts.filterOptions,
  };
}

// ─── Tables ───

export const TABLES: TableMeta[] = [
  {
    key: 'Machines',
    label: 'Machines',
    fields: [
      field('Machines', 'MachineID',        'Machine ID',          'number',   { aggregatable: true }),
      field('Machines', 'FinalCode',        'Machine Code',        'string'),
      field('Machines', 'Type',             'Type',                'string',   { filterOptions: ['MACHINE', 'TOOLING'] }),
      field('Machines', 'MachineGroup',     'Group',               'string'),
      field('Machines', 'Description',      'Description',         'string'),
      field('Machines', 'PurchasingDate',   'Purchasing Date',     'date'),
      field('Machines', 'PurchasingCost',   'Purchasing Cost',     'decimal',  { aggregatable: true }),
      field('Machines', 'PONumber',         'PO Number',           'string'),
      field('Machines', 'Area',             'Area',                'string'),
      field('Machines', 'Manufacturer',     'Manufacturer',        'string'),
      field('Machines', 'Model',            'Model',               'string'),
      field('Machines', 'SerialNumber',     'Serial Number',       'string'),
      field('Machines', 'ManufacturerYear', 'Manufacturer Year',   'string'),
      field('Machines', 'Power',            'Power',               'string'),
      field('Machines', 'PermissionRequired',  'Permission Required', 'boolean'),
      field('Machines', 'AuthorizationGroup',  'Auth Group',          'string'),
      field('Machines', 'MaintenanceNeeded',   'Maintenance Needed',  'boolean'),
      field('Machines', 'MaintenanceOnHold',   'Maintenance On Hold', 'boolean'),
      field('Machines', 'PersonInChargeID',    'Person In Charge ID', 'number'),
      field('Machines', 'CreatedDate',      'Created Date',        'datetime'),
      field('Machines', 'UpdatedDate',      'Updated Date',        'datetime'),
    ],
  },
  {
    key: 'MaintenanceActions',
    label: 'Maintenance Actions',
    fields: [
      field('MaintenanceActions', 'ActionID',           'Action ID',           'number',  { aggregatable: true }),
      field('MaintenanceActions', 'MachineID',          'Machine ID',          'number'),
      field('MaintenanceActions', 'Action',             'Action',              'string'),
      field('MaintenanceActions', 'Periodicity',        'Periodicity',         'string',  { filterOptions: ['BEFORE EACH USE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] }),
      field('MaintenanceActions', 'IntervalMultiplier', 'Interval Multiplier', 'number',  { aggregatable: true }),
      field('MaintenanceActions', 'DayOfWeek',          'Day of Week',         'number'),
      field('MaintenanceActions', 'WeekOfMonth',        'Week of Month',       'number'),
      field('MaintenanceActions', 'QuarterMonth',       'Quarter Month',       'number'),
      field('MaintenanceActions', 'DayOfMonth',         'Day of Month',        'number'),
      field('MaintenanceActions', 'TimeNeeded',         'Time Needed (min)',   'number',  { aggregatable: true }),
      field('MaintenanceActions', 'MaintenanceInCharge', 'Maint. In Charge',  'boolean'),
      field('MaintenanceActions', 'Status',             'Status',              'string',  { filterOptions: ['IDEAL', 'MANDATORY'] }),
      field('MaintenanceActions', 'Month',              'Month',               'string'),
      field('MaintenanceActions', 'CreatedDate',        'Created Date',        'datetime'),
    ],
  },
  {
    key: 'MaintenanceExecutions',
    label: 'Maintenance Executions',
    fields: [
      field('MaintenanceExecutions', 'ExecutionID',    'Execution ID',      'number',   { aggregatable: true }),
      field('MaintenanceExecutions', 'ActionID',       'Action ID',         'number'),
      field('MaintenanceExecutions', 'MachineID',      'Machine ID',        'number'),
      field('MaintenanceExecutions', 'ScheduledDate',  'Scheduled Date',    'date'),
      field('MaintenanceExecutions', 'Status',         'Execution Status',  'string',   { filterOptions: ['PENDING', 'COMPLETED', 'SKIPPED'] }),
      field('MaintenanceExecutions', 'ActualTime',     'Actual Time (min)', 'number',   { aggregatable: true }),
      field('MaintenanceExecutions', 'CompletedByID',  'Completed By ID',   'number'),
      field('MaintenanceExecutions', 'CompletedDate',  'Completed Date',    'datetime'),
      field('MaintenanceExecutions', 'Notes',          'Notes',             'string',   { sortable: false }),
      field('MaintenanceExecutions', 'CreatedDate',    'Created Date',      'datetime'),
    ],
  },
  {
    key: 'SpareParts',
    label: 'Spare Parts',
    fields: [
      field('SpareParts', 'SparePartID',  'Spare Part ID',  'number',   { aggregatable: true }),
      field('SpareParts', 'MachineID',    'Machine ID',     'number'),
      field('SpareParts', 'Description',  'Description',    'string'),
      field('SpareParts', 'Reference',    'Reference',      'string'),
      field('SpareParts', 'Quantity',     'Quantity',        'number',  { aggregatable: true }),
      field('SpareParts', 'Link',         'Link',            'string',  { filterable: false, sortable: false }),
      field('SpareParts', 'CreatedDate',  'Created Date',   'datetime'),
    ],
  },
  {
    key: 'Operators',
    label: 'Operators',
    fields: [
      field('Operators', 'OperatorID',     'Operator ID',    'number',  { aggregatable: true }),
      field('Operators', 'OperatorName',   'Operator Name',  'string'),
      field('Operators', 'Email',          'Email',           'string'),
      field('Operators', 'Department',     'Department',      'string'),
      field('Operators', 'IsActive',       'Active',          'boolean'),
      field('Operators', 'Role',           'Role',            'string',  { filterOptions: ['ADMIN', 'USER', 'VIEWER'] }),
      field('Operators', 'DefaultShiftID', 'Default Shift',   'number'),
      field('Operators', 'CreatedDate',    'Created Date',    'datetime'),
    ],
  },
  {
    key: 'SupportTickets',
    label: 'Support Tickets',
    fields: [
      field('SupportTickets', 'TicketID',        'Ticket ID',       'number',   { aggregatable: true }),
      field('SupportTickets', 'TicketCode',      'Ticket Code',     'string'),
      field('SupportTickets', 'MachineID',       'Machine ID',      'number'),
      field('SupportTickets', 'Title',           'Title',            'string'),
      field('SupportTickets', 'Category',        'Category',         'string'),
      field('SupportTickets', 'Priority',        'Priority',         'string',  { filterOptions: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] }),
      field('SupportTickets', 'Status',          'Status',           'string',  { filterOptions: ['SUBMITTED', 'APPROVED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'] }),
      field('SupportTickets', 'SubmittedByID',   'Submitted By ID',  'number'),
      field('SupportTickets', 'AssignedToID',    'Assigned To ID',   'number'),
      field('SupportTickets', 'ApprovedByID',    'Approved By ID',   'number'),
      field('SupportTickets', 'DueDate',         'Due Date',         'date'),
      field('SupportTickets', 'ResolvedDate',    'Resolved Date',    'datetime'),
      field('SupportTickets', 'ClosedDate',      'Closed Date',      'datetime'),
      field('SupportTickets', 'CreatedDate',     'Created Date',     'datetime'),
    ],
  },
  {
    key: 'Shifts',
    label: 'Shifts',
    fields: [
      field('Shifts', 'ShiftID',    'Shift ID',    'number',  { aggregatable: true }),
      field('Shifts', 'ShiftName',  'Shift Name',  'string'),
      field('Shifts', 'StartTime',  'Start Time',  'string'),
      field('Shifts', 'EndTime',    'End Time',    'string'),
      field('Shifts', 'IsActive',   'Active',      'boolean'),
    ],
  },
  {
    key: 'AuthorizationMatrix',
    label: 'Authorization Matrix',
    fields: [
      field('AuthorizationMatrix', 'AuthMatrixID',  'Auth Matrix ID',  'number',  { aggregatable: true }),
      field('AuthorizationMatrix', 'OperatorID',    'Operator ID',     'number'),
      field('AuthorizationMatrix', 'UpdatedDate',   'Updated Date',    'date'),
    ],
  },
];

// ─── Joins ───

export const JOINS: JoinMeta[] = [
  { from: 'MaintenanceActions',    to: 'Machines',            fromColumn: 'MachineID',       toColumn: 'MachineID',   type: 'INNER' },
  { from: 'MaintenanceExecutions', to: 'Machines',            fromColumn: 'MachineID',       toColumn: 'MachineID',   type: 'INNER' },
  { from: 'MaintenanceExecutions', to: 'MaintenanceActions',  fromColumn: 'ActionID',        toColumn: 'ActionID',    type: 'INNER' },
  { from: 'MaintenanceExecutions', to: 'Operators',           fromColumn: 'CompletedByID',   toColumn: 'OperatorID',  type: 'LEFT', alias: 'CompletedBy' },
  { from: 'SpareParts',           to: 'Machines',            fromColumn: 'MachineID',       toColumn: 'MachineID',   type: 'INNER' },
  { from: 'SupportTickets',       to: 'Machines',            fromColumn: 'MachineID',       toColumn: 'MachineID',   type: 'INNER' },
  { from: 'SupportTickets',       to: 'Operators',           fromColumn: 'SubmittedByID',   toColumn: 'OperatorID',  type: 'LEFT', alias: 'SubmittedBy' },
  { from: 'SupportTickets',       to: 'Operators',           fromColumn: 'AssignedToID',    toColumn: 'OperatorID',  type: 'LEFT', alias: 'AssignedTo' },
  { from: 'Machines',             to: 'Operators',           fromColumn: 'PersonInChargeID', toColumn: 'OperatorID', type: 'LEFT', alias: 'PersonInCharge' },
  { from: 'Operators',            to: 'Shifts',              fromColumn: 'DefaultShiftID',  toColumn: 'ShiftID',     type: 'LEFT' },
  { from: 'AuthorizationMatrix',  to: 'Operators',           fromColumn: 'OperatorID',      toColumn: 'OperatorID',  type: 'INNER' },
];

// ─── Computed Fields ───

export const COMPUTED_FIELDS: ComputedFieldMeta[] = [
  {
    key: 'completionRate',
    label: 'Completion Rate (%)',
    requiredTables: ['MaintenanceExecutions'],
    dataType: 'decimal',
    requiresGroupBy: true,
  },
  {
    key: 'daysSinceLastMaintenance',
    label: 'Days Since Last Maintenance',
    requiredTables: ['MaintenanceExecutions'],
    dataType: 'number',
    requiresGroupBy: true,
  },
  {
    key: 'overdueFlag',
    label: 'Overdue',
    requiredTables: ['MaintenanceExecutions'],
    dataType: 'boolean',
    requiresGroupBy: false,
  },
  {
    key: 'stockLevelStatus',
    label: 'Stock Level',
    requiredTables: ['SpareParts'],
    dataType: 'string',
    requiresGroupBy: false,
  },
  {
    key: 'ticketAgeDays',
    label: 'Ticket Age (Days)',
    requiredTables: ['SupportTickets'],
    dataType: 'number',
    requiresGroupBy: false,
  },
  {
    key: 'totalSparePartsPerMachine',
    label: 'Total Spare Parts',
    requiredTables: ['SpareParts'],
    dataType: 'number',
    requiresGroupBy: true,
  },
  {
    key: 'avgActualTime',
    label: 'Avg Actual Time (min)',
    requiredTables: ['MaintenanceExecutions'],
    dataType: 'decimal',
    requiresGroupBy: true,
  },
];

// ─── Lookup helpers ───

const tableMap = new Map(TABLES.map(t => [t.key, t]));
const fieldMap = new Map(TABLES.flatMap(t => t.fields.map(f => [f.key, { table: t, field: f }])));
const computedFieldMap = new Map(COMPUTED_FIELDS.map(cf => [cf.key, cf]));

export function getTable(key: string): TableMeta | undefined {
  return tableMap.get(key);
}

export function getField(key: string): { table: TableMeta; field: FieldMeta } | undefined {
  return fieldMap.get(key);
}

export function getComputedField(key: string): ComputedFieldMeta | undefined {
  return computedFieldMap.get(key);
}

export function getFieldsForTables(tableKeys: string[]): FieldMeta[] {
  return tableKeys.flatMap(k => tableMap.get(k)?.fields ?? []);
}
