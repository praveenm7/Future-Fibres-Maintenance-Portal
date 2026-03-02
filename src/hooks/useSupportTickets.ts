import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { SupportTicket, TicketComment, TicketAttachment, SupportDashboardData } from '@/types/support';
import { toast } from 'sonner';

export const useSupportTickets = () => {
    const queryClient = useQueryClient();

    const useGetTickets = () => {
        return useQuery({
            queryKey: ['support-tickets'],
            queryFn: () => api.get<SupportTicket[]>('/support-tickets'),
        });
    };

    const useGetTicket = (id: string) => {
        return useQuery({
            queryKey: ['support-tickets', id],
            queryFn: () => api.get<SupportTicket>(`/support-tickets/${id}`),
            enabled: !!id,
        });
    };

    const useCreateTicket = () => {
        return useMutation({
            mutationFn: (data: Record<string, unknown>) =>
                api.post<SupportTicket>('/support-tickets', data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
                queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
                toast.success('Support ticket created successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to create ticket: ${error.message}`);
            },
        });
    };

    const useUpdateTicket = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
                api.put<SupportTicket>(`/support-tickets/${id}`, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
                toast.success('Ticket updated successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update ticket: ${error.message}`);
            },
        });
    };

    const useUpdateTicketStatus = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
                api.patch<SupportTicket>(`/support-tickets/${id}/status`, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
                queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
                toast.success('Ticket status updated');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update status: ${error.message}`);
            },
        });
    };

    const useDeleteTicket = () => {
        return useMutation({
            mutationFn: (id: string) => api.delete(`/support-tickets/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
                queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
                toast.success('Ticket deleted');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete ticket: ${error.message}`);
            },
        });
    };

    // Comments
    const useGetTicketComments = (ticketId: string) => {
        return useQuery({
            queryKey: ['ticket-comments', ticketId],
            queryFn: () => api.get<TicketComment[]>(`/ticket-comments?ticketId=${ticketId}`),
            enabled: !!ticketId,
        });
    };

    const useAddTicketComment = () => {
        return useMutation({
            mutationFn: (data: { ticketId: number; comment: string; operatorId: number }) =>
                api.post<TicketComment>('/ticket-comments', data),
            onSuccess: (_, variables) => {
                queryClient.invalidateQueries({ queryKey: ['ticket-comments', variables.ticketId.toString()] });
                queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
                toast.success('Comment added');
            },
            onError: (error: Error) => {
                toast.error(`Failed to add comment: ${error.message}`);
            },
        });
    };

    const useDeleteTicketComment = () => {
        return useMutation({
            mutationFn: (id: string) => api.delete(`/ticket-comments/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['ticket-comments'] });
                queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
                toast.success('Comment deleted');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete comment: ${error.message}`);
            },
        });
    };

    // Attachments
    const useGetTicketAttachments = (ticketId: string) => {
        return useQuery({
            queryKey: ['ticket-attachments', ticketId],
            queryFn: () => api.get<TicketAttachment[]>(`/ticket-attachments?ticketId=${ticketId}`),
            enabled: !!ticketId,
        });
    };

    const useUploadTicketAttachment = () => {
        return useMutation({
            mutationFn: (formData: FormData) =>
                api.upload<TicketAttachment>('/ticket-attachments', formData),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['ticket-attachments'] });
                queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
                toast.success('Attachment uploaded');
            },
            onError: (error: Error) => {
                toast.error(`Upload failed: ${error.message}`);
            },
        });
    };

    const useDeleteTicketAttachment = () => {
        return useMutation({
            mutationFn: (id: string) => api.delete(`/ticket-attachments/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['ticket-attachments'] });
                queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
                toast.success('Attachment deleted');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete attachment: ${error.message}`);
            },
        });
    };

    // Dashboard
    const useSupportDashboard = () => {
        return useQuery({
            queryKey: ['dashboards', 'support'],
            queryFn: () => api.get<SupportDashboardData>('/dashboards/support'),
            staleTime: 60000,
        });
    };

    return {
        useGetTickets,
        useGetTicket,
        useCreateTicket,
        useUpdateTicket,
        useUpdateTicketStatus,
        useDeleteTicket,
        useGetTicketComments,
        useAddTicketComment,
        useDeleteTicketComment,
        useGetTicketAttachments,
        useUploadTicketAttachment,
        useDeleteTicketAttachment,
        useSupportDashboard,
    };
};
