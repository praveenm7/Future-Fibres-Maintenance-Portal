/**
 * Report Metadata Registry (Server-Side Security Whitelist)
 *
 * SECURITY-CRITICAL: Only identifiers defined here can appear in generated SQL.
 * Every table name, column name, join, and computed field must be whitelisted.
 */

// Data types that map to mssql parameter types
const DATA_TYPES = {
    string: 'NVarChar',
    number: 'Int',
    decimal: 'Decimal',
    boolean: 'Bit',
    date: 'Date',
    datetime: 'DateTime',
};

const tables = {
    Machines: {
        dbTable: 'Machines',
        label: 'Machines',
        hasEntityId: true,
        fields: {
            'Machines.MachineID':        { dbColumn: 'MachineID',        label: 'Machine ID',          dataType: 'number',  filterable: true,  sortable: true,  aggregatable: true  },
            'Machines.FinalCode':        { dbColumn: 'FinalCode',        label: 'Machine Code',        dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.Type':             { dbColumn: 'Type',             label: 'Type',                dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false, filterOptions: ['MACHINE', 'TOOLING'] },
            'Machines.MachineGroup':     { dbColumn: 'MachineGroup',     label: 'Group',               dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.Description':      { dbColumn: 'Description',      label: 'Description',         dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.PurchasingDate':   { dbColumn: 'PurchasingDate',   label: 'Purchasing Date',     dataType: 'date',    filterable: true,  sortable: true,  aggregatable: false },
            'Machines.PurchasingCost':   { dbColumn: 'PurchasingCost',   label: 'Purchasing Cost',     dataType: 'decimal', filterable: true,  sortable: true,  aggregatable: true  },
            'Machines.PONumber':         { dbColumn: 'PONumber',         label: 'PO Number',           dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.Area':             { dbColumn: 'Area',             label: 'Area',                dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.Manufacturer':     { dbColumn: 'Manufacturer',     label: 'Manufacturer',        dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.Model':            { dbColumn: 'Model',            label: 'Model',               dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.SerialNumber':     { dbColumn: 'SerialNumber',     label: 'Serial Number',       dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.ManufacturerYear': { dbColumn: 'ManufacturerYear', label: 'Manufacturer Year',   dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.Power':            { dbColumn: 'Power',            label: 'Power',               dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.PermissionRequired':  { dbColumn: 'PermissionRequired',  label: 'Permission Required', dataType: 'boolean', filterable: true,  sortable: true,  aggregatable: false },
            'Machines.AuthorizationGroup':  { dbColumn: 'AuthorizationGroup',  label: 'Auth Group',          dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.MaintenanceNeeded':   { dbColumn: 'MaintenanceNeeded',   label: 'Maintenance Needed',  dataType: 'boolean', filterable: true,  sortable: true,  aggregatable: false },
            'Machines.MaintenanceOnHold':   { dbColumn: 'MaintenanceOnHold',   label: 'Maintenance On Hold', dataType: 'boolean', filterable: true,  sortable: true,  aggregatable: false },
            'Machines.PersonInChargeID':    { dbColumn: 'PersonInChargeID',    label: 'Person In Charge ID', dataType: 'number',  filterable: true,  sortable: true,  aggregatable: false },
            'Machines.CreatedDate':      { dbColumn: 'CreatedDate',      label: 'Created Date',        dataType: 'datetime', filterable: true, sortable: true,  aggregatable: false },
            'Machines.UpdatedDate':      { dbColumn: 'UpdatedDate',      label: 'Updated Date',        dataType: 'datetime', filterable: true, sortable: true,  aggregatable: false },
        },
    },

    MaintenanceActions: {
        dbTable: 'MaintenanceActions',
        label: 'Maintenance Actions',
        hasEntityId: true,
        fields: {
            'MaintenanceActions.ActionID':           { dbColumn: 'ActionID',           label: 'Action ID',           dataType: 'number',  filterable: true,  sortable: true,  aggregatable: true  },
            'MaintenanceActions.MachineID':          { dbColumn: 'MachineID',          label: 'Machine ID',          dataType: 'number',  filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceActions.Action':             { dbColumn: 'Action',             label: 'Action',              dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceActions.Periodicity':        { dbColumn: 'Periodicity',        label: 'Periodicity',         dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false, filterOptions: ['BEFORE EACH USE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] },
            'MaintenanceActions.IntervalMultiplier': { dbColumn: 'IntervalMultiplier', label: 'Interval Multiplier', dataType: 'number',  filterable: true,  sortable: true,  aggregatable: true  },
            'MaintenanceActions.DayOfWeek':          { dbColumn: 'DayOfWeek',          label: 'Day of Week',         dataType: 'number',  filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceActions.WeekOfMonth':        { dbColumn: 'WeekOfMonth',        label: 'Week of Month',       dataType: 'number',  filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceActions.QuarterMonth':       { dbColumn: 'QuarterMonth',       label: 'Quarter Month',       dataType: 'number',  filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceActions.DayOfMonth':         { dbColumn: 'DayOfMonth',         label: 'Day of Month',        dataType: 'number',  filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceActions.TimeNeeded':         { dbColumn: 'TimeNeeded',         label: 'Time Needed (min)',   dataType: 'number',  filterable: true,  sortable: true,  aggregatable: true  },
            'MaintenanceActions.MaintenanceInCharge': { dbColumn: 'MaintenanceInCharge', label: 'Maint. In Charge', dataType: 'boolean', filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceActions.Status':             { dbColumn: 'Status',             label: 'Status',              dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false, filterOptions: ['IDEAL', 'MANDATORY'] },
            'MaintenanceActions.Month':              { dbColumn: 'Month',              label: 'Month',               dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceActions.CreatedDate':        { dbColumn: 'CreatedDate',        label: 'Created Date',        dataType: 'datetime', filterable: true, sortable: true,  aggregatable: false },
        },
    },

    MaintenanceExecutions: {
        dbTable: 'MaintenanceExecutions',
        label: 'Maintenance Executions',
        hasEntityId: true,
        fields: {
            'MaintenanceExecutions.ExecutionID':    { dbColumn: 'ExecutionID',    label: 'Execution ID',       dataType: 'number',   filterable: true,  sortable: true,  aggregatable: true  },
            'MaintenanceExecutions.ActionID':       { dbColumn: 'ActionID',       label: 'Action ID',          dataType: 'number',   filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceExecutions.MachineID':      { dbColumn: 'MachineID',      label: 'Machine ID',         dataType: 'number',   filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceExecutions.ScheduledDate':  { dbColumn: 'ScheduledDate',  label: 'Scheduled Date',     dataType: 'date',     filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceExecutions.Status':         { dbColumn: 'Status',         label: 'Execution Status',   dataType: 'string',   filterable: true,  sortable: true,  aggregatable: false, filterOptions: ['PENDING', 'COMPLETED', 'SKIPPED'] },
            'MaintenanceExecutions.ActualTime':     { dbColumn: 'ActualTime',     label: 'Actual Time (min)',  dataType: 'number',   filterable: true,  sortable: true,  aggregatable: true  },
            'MaintenanceExecutions.CompletedByID':  { dbColumn: 'CompletedByID',  label: 'Completed By ID',    dataType: 'number',   filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceExecutions.CompletedDate':  { dbColumn: 'CompletedDate',  label: 'Completed Date',     dataType: 'datetime', filterable: true,  sortable: true,  aggregatable: false },
            'MaintenanceExecutions.Notes':          { dbColumn: 'Notes',          label: 'Notes',              dataType: 'string',   filterable: true,  sortable: false, aggregatable: false },
            'MaintenanceExecutions.CreatedDate':    { dbColumn: 'CreatedDate',    label: 'Created Date',       dataType: 'datetime', filterable: true,  sortable: true,  aggregatable: false },
        },
    },

    SpareParts: {
        dbTable: 'SpareParts',
        label: 'Spare Parts',
        hasEntityId: true,
        fields: {
            'SpareParts.SparePartID':  { dbColumn: 'SparePartID',  label: 'Spare Part ID',  dataType: 'number',  filterable: true,  sortable: true,  aggregatable: true  },
            'SpareParts.MachineID':    { dbColumn: 'MachineID',    label: 'Machine ID',     dataType: 'number',  filterable: true,  sortable: true,  aggregatable: false },
            'SpareParts.Description':  { dbColumn: 'Description',  label: 'Description',    dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'SpareParts.Reference':    { dbColumn: 'Reference',    label: 'Reference',      dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'SpareParts.Quantity':     { dbColumn: 'Quantity',     label: 'Quantity',        dataType: 'number',  filterable: true,  sortable: true,  aggregatable: true  },
            'SpareParts.Link':         { dbColumn: 'Link',         label: 'Link',            dataType: 'string',  filterable: false, sortable: false, aggregatable: false },
            'SpareParts.CreatedDate':  { dbColumn: 'CreatedDate',  label: 'Created Date',   dataType: 'datetime', filterable: true,  sortable: true,  aggregatable: false },
        },
    },

    Operators: {
        dbTable: 'Operators',
        label: 'Operators',
        hasEntityId: true,
        fields: {
            'Operators.OperatorID':     { dbColumn: 'OperatorID',     label: 'Operator ID',    dataType: 'number',  filterable: true,  sortable: true,  aggregatable: true  },
            'Operators.OperatorName':   { dbColumn: 'OperatorName',   label: 'Operator Name',  dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Operators.Email':          { dbColumn: 'Email',          label: 'Email',           dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Operators.Department':     { dbColumn: 'Department',     label: 'Department',      dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Operators.IsActive':       { dbColumn: 'IsActive',       label: 'Active',          dataType: 'boolean', filterable: true,  sortable: true,  aggregatable: false },
            'Operators.Role':           { dbColumn: 'Role',           label: 'Role',            dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false, filterOptions: ['ADMIN', 'USER', 'VIEWER'] },
            'Operators.DefaultShiftID': { dbColumn: 'DefaultShiftID', label: 'Default Shift',   dataType: 'number',  filterable: true,  sortable: true,  aggregatable: false },
            'Operators.CreatedDate':    { dbColumn: 'CreatedDate',    label: 'Created Date',    dataType: 'datetime', filterable: true, sortable: true,  aggregatable: false },
        },
    },

    SupportTickets: {
        dbTable: 'SupportTickets',
        label: 'Support Tickets',
        hasEntityId: true,
        fields: {
            'SupportTickets.TicketID':        { dbColumn: 'TicketID',        label: 'Ticket ID',       dataType: 'number',   filterable: true,  sortable: true,  aggregatable: true  },
            'SupportTickets.TicketCode':      { dbColumn: 'TicketCode',      label: 'Ticket Code',     dataType: 'string',   filterable: true,  sortable: true,  aggregatable: false },
            'SupportTickets.MachineID':       { dbColumn: 'MachineID',       label: 'Machine ID',      dataType: 'number',   filterable: true,  sortable: true,  aggregatable: false },
            'SupportTickets.Title':           { dbColumn: 'Title',           label: 'Title',            dataType: 'string',   filterable: true,  sortable: true,  aggregatable: false },
            'SupportTickets.Category':        { dbColumn: 'Category',        label: 'Category',         dataType: 'string',   filterable: true,  sortable: true,  aggregatable: false },
            'SupportTickets.Priority':        { dbColumn: 'Priority',        label: 'Priority',         dataType: 'string',   filterable: true,  sortable: true,  aggregatable: false, filterOptions: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
            'SupportTickets.Status':          { dbColumn: 'Status',          label: 'Status',           dataType: 'string',   filterable: true,  sortable: true,  aggregatable: false, filterOptions: ['SUBMITTED', 'APPROVED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'] },
            'SupportTickets.SubmittedByID':   { dbColumn: 'SubmittedByID',   label: 'Submitted By ID',  dataType: 'number',   filterable: true,  sortable: true,  aggregatable: false },
            'SupportTickets.AssignedToID':    { dbColumn: 'AssignedToID',    label: 'Assigned To ID',   dataType: 'number',   filterable: true,  sortable: true,  aggregatable: false },
            'SupportTickets.ApprovedByID':    { dbColumn: 'ApprovedByID',    label: 'Approved By ID',   dataType: 'number',   filterable: true,  sortable: true,  aggregatable: false },
            'SupportTickets.DueDate':         { dbColumn: 'DueDate',         label: 'Due Date',         dataType: 'date',     filterable: true,  sortable: true,  aggregatable: false },
            'SupportTickets.ResolvedDate':    { dbColumn: 'ResolvedDate',    label: 'Resolved Date',    dataType: 'datetime', filterable: true,  sortable: true,  aggregatable: false },
            'SupportTickets.ClosedDate':      { dbColumn: 'ClosedDate',      label: 'Closed Date',      dataType: 'datetime', filterable: true,  sortable: true,  aggregatable: false },
            'SupportTickets.CreatedDate':     { dbColumn: 'CreatedDate',     label: 'Created Date',     dataType: 'datetime', filterable: true,  sortable: true,  aggregatable: false },
        },
    },

    Shifts: {
        dbTable: 'Shifts',
        label: 'Shifts',
        hasEntityId: true,
        fields: {
            'Shifts.ShiftID':    { dbColumn: 'ShiftID',    label: 'Shift ID',    dataType: 'number',  filterable: true,  sortable: true,  aggregatable: true  },
            'Shifts.ShiftName':  { dbColumn: 'ShiftName',  label: 'Shift Name',  dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Shifts.StartTime':  { dbColumn: 'StartTime',  label: 'Start Time',  dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Shifts.EndTime':    { dbColumn: 'EndTime',    label: 'End Time',    dataType: 'string',  filterable: true,  sortable: true,  aggregatable: false },
            'Shifts.IsActive':   { dbColumn: 'IsActive',   label: 'Active',      dataType: 'boolean', filterable: true,  sortable: true,  aggregatable: false },
        },
    },

    AuthorizationMatrix: {
        dbTable: 'AuthorizationMatrix',
        label: 'Authorization Matrix',
        hasEntityId: true,
        fields: {
            'AuthorizationMatrix.AuthMatrixID':  { dbColumn: 'AuthMatrixID',  label: 'Auth Matrix ID',  dataType: 'number',   filterable: true,  sortable: true,  aggregatable: true  },
            'AuthorizationMatrix.OperatorID':    { dbColumn: 'OperatorID',    label: 'Operator ID',     dataType: 'number',   filterable: true,  sortable: true,  aggregatable: false },
            'AuthorizationMatrix.UpdatedDate':   { dbColumn: 'UpdatedDate',   label: 'Updated Date',    dataType: 'date',     filterable: true,  sortable: true,  aggregatable: false },
        },
    },
};

// Joins define relationships between tables for auto-join resolution.
// 'alias' is used when a table appears multiple times (e.g., Operators as different roles).
const joins = [
    { from: 'MaintenanceActions',    to: 'Machines',  fromColumn: 'MachineID',       toColumn: 'MachineID',   type: 'INNER' },
    { from: 'MaintenanceExecutions', to: 'Machines',  fromColumn: 'MachineID',       toColumn: 'MachineID',   type: 'INNER' },
    { from: 'MaintenanceExecutions', to: 'MaintenanceActions', fromColumn: 'ActionID', toColumn: 'ActionID', type: 'INNER' },
    { from: 'MaintenanceExecutions', to: 'Operators', fromColumn: 'CompletedByID',   toColumn: 'OperatorID',  type: 'LEFT', alias: 'CompletedBy' },
    { from: 'SpareParts',           to: 'Machines',  fromColumn: 'MachineID',       toColumn: 'MachineID',   type: 'INNER' },
    { from: 'SupportTickets',       to: 'Machines',  fromColumn: 'MachineID',       toColumn: 'MachineID',   type: 'INNER' },
    { from: 'SupportTickets',       to: 'Operators', fromColumn: 'SubmittedByID',   toColumn: 'OperatorID',  type: 'LEFT', alias: 'SubmittedBy' },
    { from: 'SupportTickets',       to: 'Operators', fromColumn: 'AssignedToID',    toColumn: 'OperatorID',  type: 'LEFT', alias: 'AssignedTo' },
    { from: 'Machines',             to: 'Operators', fromColumn: 'PersonInChargeID', toColumn: 'OperatorID', type: 'LEFT', alias: 'PersonInCharge' },
    { from: 'Operators',            to: 'Shifts',    fromColumn: 'DefaultShiftID',  toColumn: 'ShiftID',     type: 'LEFT' },
    { from: 'AuthorizationMatrix',  to: 'Operators', fromColumn: 'OperatorID',      toColumn: 'OperatorID',  type: 'INNER' },
];

// Computed fields — SQL expressions are SERVER-SIDE ONLY constants.
// Frontend sends only the key; backend looks up the expression.
const computedFields = {
    completionRate: {
        label: 'Completion Rate (%)',
        expression: 'CAST(SUM(CASE WHEN [MaintenanceExecutions].[Status] = \'COMPLETED\' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT([MaintenanceExecutions].[ExecutionID]), 0) AS DECIMAL(5,2))',
        requiredTables: ['MaintenanceExecutions'],
        dataType: 'decimal',
        requiresGroupBy: true,
    },
    daysSinceLastMaintenance: {
        label: 'Days Since Last Maintenance',
        expression: 'DATEDIFF(DAY, MAX([MaintenanceExecutions].[CompletedDate]), GETDATE())',
        requiredTables: ['MaintenanceExecutions'],
        dataType: 'number',
        requiresGroupBy: true,
    },
    overdueFlag: {
        label: 'Overdue',
        expression: 'CASE WHEN [MaintenanceExecutions].[ScheduledDate] < CAST(GETDATE() AS DATE) AND [MaintenanceExecutions].[Status] = \'PENDING\' THEN 1 ELSE 0 END',
        requiredTables: ['MaintenanceExecutions'],
        dataType: 'boolean',
        requiresGroupBy: false,
    },
    stockLevelStatus: {
        label: 'Stock Level',
        expression: 'CASE WHEN [SpareParts].[Quantity] = 0 THEN \'OUT OF STOCK\' WHEN [SpareParts].[Quantity] <= 2 THEN \'LOW\' ELSE \'OK\' END',
        requiredTables: ['SpareParts'],
        dataType: 'string',
        requiresGroupBy: false,
    },
    ticketAgeDays: {
        label: 'Ticket Age (Days)',
        expression: 'DATEDIFF(DAY, [SupportTickets].[CreatedDate], COALESCE([SupportTickets].[ResolvedDate], GETDATE()))',
        requiredTables: ['SupportTickets'],
        dataType: 'number',
        requiresGroupBy: false,
    },
    totalSparePartsPerMachine: {
        label: 'Total Spare Parts',
        expression: 'COUNT([SpareParts].[SparePartID])',
        requiredTables: ['SpareParts'],
        dataType: 'number',
        requiresGroupBy: true,
    },
    avgActualTime: {
        label: 'Avg Actual Time (min)',
        expression: 'AVG([MaintenanceExecutions].[ActualTime])',
        requiredTables: ['MaintenanceExecutions'],
        dataType: 'decimal',
        requiresGroupBy: true,
    },
};

// Valid filter operators per data type
const filterOperatorsByType = {
    string:   ['eq', 'neq', 'contains', 'startsWith', 'endsWith', 'in', 'notIn', 'isNull', 'isNotNull'],
    number:   ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'notIn', 'isNull', 'isNotNull'],
    decimal:  ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
    boolean:  ['eq', 'neq'],
    date:     ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
    datetime: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
};

// Valid aggregation functions
const validAggFunctions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

module.exports = {
    DATA_TYPES,
    tables,
    joins,
    computedFields,
    filterOperatorsByType,
    validAggFunctions,
};
