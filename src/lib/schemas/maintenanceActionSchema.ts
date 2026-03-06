import { z } from 'zod';

// Preprocess nullable number fields: pass null/undefined through, coerce others to number
const nullableInt = (min: number, max: number) =>
  z.preprocess(
    (val) => (val === null || val === undefined ? null : Number(val)),
    z.number().int().min(min).max(max).nullable()
  ).optional();

export const maintenanceActionFormSchema = z.object({
  action: z.string().min(1, 'Action description is required'),
  periodicity: z.enum(['BEFORE EACH USE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  intervalMultiplier: z.coerce.number().int().min(1).max(365).default(1),
  dayOfWeek: nullableInt(0, 6),
  weekOfMonth: nullableInt(1, 4),
  quarterMonth: nullableInt(1, 3),
  dayOfMonth: nullableInt(1, 28),
  timeNeeded: z.coerce.number().int().min(1, 'Time must be at least 1 minute'),
  maintenanceInCharge: z.boolean(),
  status: z.string(),
  month: z.string(),
});

export type MaintenanceActionFormValues = z.infer<typeof maintenanceActionFormSchema>;
