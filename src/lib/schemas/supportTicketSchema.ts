import { z } from 'zod';

export const supportTicketFormSchema = z.object({
    machineId: z.string().min(1, 'Machine is required'),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
    description: z.string().max(4000).optional(),
    category: z.string().min(1, 'Category is required'),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    submittedById: z.string().min(1, 'Submitter is required'),
});

export type SupportTicketFormValues = z.infer<typeof supportTicketFormSchema>;

export const ticketStatusUpdateSchema = z.object({
    status: z.enum(['SUBMITTED', 'APPROVED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']),
    assignedToId: z.string().optional().nullable(),
    approvedById: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    resolutionNotes: z.string().max(4000).optional().nullable(),
});

export type TicketStatusUpdateValues = z.infer<typeof ticketStatusUpdateSchema>;

export const ticketCommentSchema = z.object({
    comment: z.string().min(1, 'Comment is required').max(2000, 'Comment must be 2000 characters or less'),
});

export type TicketCommentValues = z.infer<typeof ticketCommentSchema>;
