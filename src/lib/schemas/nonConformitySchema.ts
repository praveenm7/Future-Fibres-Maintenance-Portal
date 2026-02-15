import { z } from 'zod';

export const nonConformityFormSchema = z.object({
  maintenanceOperator: z.string().min(1, 'Operator name is required'),
  creationDate: z.string().min(1, 'Creation date is required'),
  initiationDate: z.string(),
  status: z.string().min(1, 'Status is required'),
  priority: z.coerce.number().int().min(1),
  category: z.string().optional(),
});

export type NonConformityFormValues = z.infer<typeof nonConformityFormSchema>;
