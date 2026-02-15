import { z } from 'zod';

export const authMatrixFormSchema = z.object({
  operatorName: z.string().min(1, 'Operator name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  department: z.string().optional(),
  updatedDate: z.string(),
  authorizations: z.record(z.string(), z.boolean()),
});

export type AuthMatrixFormValues = z.infer<typeof authMatrixFormSchema>;
