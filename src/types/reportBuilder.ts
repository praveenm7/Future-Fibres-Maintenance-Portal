// ─── Report Definition (stored as JSON in the database) ───

export interface ReportDefinition {
  version: 1;
  dataSources: string[];
  columns: ReportColumn[];
  filters: ReportFilter[];
  sorting: ReportSort[];
  groupBy: string[];
  aggregations: ReportAggregation[];
  computedFields: string[];
  limit?: number;
}

export interface ReportColumn {
  fieldKey: string;
  alias?: string;
  visible: boolean;
}

export type FilterOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'in' | 'notIn' | 'isNull' | 'isNotNull' | 'between';

export interface ReportFilter {
  fieldKey: string;
  operator: FilterOperator;
  value: unknown;
}

export interface ReportSort {
  fieldKey: string;
  direction: 'asc' | 'desc';
}

export type AggregationFunction = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';

export interface ReportAggregation {
  fieldKey: string;
  function: AggregationFunction;
  alias: string;
}

// ─── Custom Report (CRUD entity from the API) ───

export interface CustomReport {
  id: number;
  reportName: string;
  description: string | null;
  definition: ReportDefinition;
  ownerOperatorId: number;
  ownerName: string;
  isShared: boolean;
  entityId: number;
  createdDate: string;
  updatedDate: string;
}

export interface CreateReportPayload {
  reportName: string;
  description?: string;
  definition: ReportDefinition;
  ownerOperatorId: number;
  isShared: boolean;
}

export interface UpdateReportPayload {
  reportName?: string;
  description?: string;
  definition?: ReportDefinition;
  isShared?: boolean;
}

export interface ReportExecutionResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  executionMs: number;
  generatedSql?: string;
}

// ─── Metadata Registry Types ───

export type FieldDataType = 'string' | 'number' | 'decimal' | 'boolean' | 'date' | 'datetime';

export interface FieldMeta {
  key: string;
  dbColumn: string;
  label: string;
  dataType: FieldDataType;
  filterable: boolean;
  sortable: boolean;
  aggregatable: boolean;
  filterOptions?: string[];
}

export interface TableMeta {
  key: string;
  label: string;
  icon?: string;
  fields: FieldMeta[];
}

export interface JoinMeta {
  from: string;
  to: string;
  fromColumn: string;
  toColumn: string;
  type: 'INNER' | 'LEFT';
  alias?: string;
}

export interface ComputedFieldMeta {
  key: string;
  label: string;
  requiredTables: string[];
  dataType: FieldDataType;
  requiresGroupBy: boolean;
}

// ─── Filter operator labels ───

export const FILTER_OPERATORS: Record<FilterOperator, string> = {
  eq: 'equals',
  neq: 'not equals',
  gt: 'greater than',
  gte: 'greater or equal',
  lt: 'less than',
  lte: 'less or equal',
  contains: 'contains',
  startsWith: 'starts with',
  endsWith: 'ends with',
  in: 'is one of',
  notIn: 'is not one of',
  isNull: 'is empty',
  isNotNull: 'is not empty',
  between: 'between',
};

export const FILTER_OPERATORS_BY_TYPE: Record<FieldDataType, FilterOperator[]> = {
  string:   ['eq', 'neq', 'contains', 'startsWith', 'endsWith', 'in', 'notIn', 'isNull', 'isNotNull'],
  number:   ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'notIn', 'isNull', 'isNotNull'],
  decimal:  ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
  boolean:  ['eq', 'neq'],
  date:     ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
  datetime: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
};
