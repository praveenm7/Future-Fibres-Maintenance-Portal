import { z } from 'zod';

export const machineFormSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  group: z.string().min(1, 'Group is required'),
  description: z.string().min(1, 'Description is required'),
  purchasingDate: z.coerce.string(),
  purchasingCost: z.coerce.string(),
  poNumber: z.coerce.string(),
  area: z.string().min(1, 'Area is required'),
  manufacturer: z.coerce.string(),
  model: z.coerce.string(),
  serialNumber: z.coerce.string(),
  manufacturerYear: z.coerce.string(),
  power: z.coerce.string(),
  permissionRequired: z.boolean(),
  authorizationGroup: z.coerce.string(),
  maintenanceNeeded: z.boolean(),
  maintenanceOnHold: z.boolean(),
  personInChargeID: z.coerce.string(),
});

export type MachineFormValues = z.infer<typeof machineFormSchema>;
