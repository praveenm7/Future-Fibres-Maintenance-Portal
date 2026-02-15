import { z } from 'zod';

export const sparePartFormSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  reference: z.string(),
  quantity: z.coerce.number().int().min(0, 'Quantity must be 0 or more'),
  link: z.string(),
});

export type SparePartFormValues = z.infer<typeof sparePartFormSchema>;
