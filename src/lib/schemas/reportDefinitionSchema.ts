import { z } from 'zod';

const reportColumnSchema = z.object({
  fieldKey: z.string().min(1),
  alias: z.string().optional(),
  visible: z.boolean().default(true),
});

const filterOperatorSchema = z.enum([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
  'contains', 'startsWith', 'endsWith',
  'in', 'notIn', 'isNull', 'isNotNull', 'between',
]);

const reportFilterSchema = z.object({
  fieldKey: z.string().min(1),
  operator: filterOperatorSchema,
  value: z.unknown(),
});

const reportSortSchema = z.object({
  fieldKey: z.string().min(1),
  direction: z.enum(['asc', 'desc']),
});

const aggregationFunctionSchema = z.enum(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']);

const reportAggregationSchema = z.object({
  fieldKey: z.string().min(1),
  function: aggregationFunctionSchema,
  alias: z.string().min(1),
});

export const reportDefinitionSchema = z.object({
  version: z.literal(1),
  dataSources: z.array(z.string().min(1)).min(1, 'Select at least one data source'),
  columns: z.array(reportColumnSchema),
  filters: z.array(reportFilterSchema),
  sorting: z.array(reportSortSchema),
  groupBy: z.array(z.string()),
  aggregations: z.array(reportAggregationSchema),
  computedFields: z.array(z.string()),
  limit: z.number().int().min(1).max(10000).optional(),
});

export const saveReportSchema = z.object({
  reportName: z.string().min(1, 'Report name is required').max(200),
  description: z.string().max(1000).optional(),
  isShared: z.boolean().default(false),
});

export type ReportDefinitionFormValues = z.infer<typeof reportDefinitionSchema>;
export type SaveReportFormValues = z.infer<typeof saveReportSchema>;
