import { z } from 'zod';

export const ncCommentFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  comment: z.string().min(1, 'Comment is required'),
  operator: z.string(),
});

export type NCCommentFormValues = z.infer<typeof ncCommentFormSchema>;
