import { z } from 'zod';

export const maintenanceActionFormSchema = z.object({
  action: z.string().min(1, 'Action description is required'),
  periodicity: z.string().min(1, 'Periodicity is required'),
  timeNeeded: z.coerce.number().int().min(1, 'Time must be at least 1 minute'),
  maintenanceInCharge: z.boolean(),
  status: z.string(),
  month: z.string(),
});

export type MaintenanceActionFormValues = z.infer<typeof maintenanceActionFormSchema>;
