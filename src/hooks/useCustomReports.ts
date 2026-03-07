import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { CustomReport, CreateReportPayload, UpdateReportPayload } from '@/types/reportBuilder';
import { toast } from 'sonner';
import { useEntityId } from '@/contexts/EntityContext';

function getOperatorId(): number {
    return parseInt(localStorage.getItem('ff-report-operator') || '0', 10);
}

function operatorHeaders(): Record<string, string> {
    return { 'X-Operator-ID': String(getOperatorId()) };
}

export const useCustomReports = () => {
    const queryClient = useQueryClient();
    const entityId = useEntityId();

    const useGetReports = () => {
        const operatorId = getOperatorId();
        return useQuery({
            queryKey: ['custom-reports', { entityId, operatorId }],
            queryFn: () => api.get<CustomReport[]>('/custom-reports', operatorHeaders()),
            enabled: !!operatorId,
        });
    };

    const useGetReport = (id: number) => {
        return useQuery({
            queryKey: ['custom-reports', id, { entityId }],
            queryFn: () => api.get<CustomReport>(`/custom-reports/${id}`),
            enabled: !!id,
        });
    };

    const useCreateReport = () => {
        return useMutation({
            mutationFn: (data: CreateReportPayload) =>
                api.post<CustomReport>('/custom-reports', data, operatorHeaders()),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
                toast.success('Report created successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to create report: ${error.message}`);
            },
        });
    };

    const useUpdateReport = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: number; data: UpdateReportPayload }) =>
                api.put<{ message: string }>(`/custom-reports/${id}`, data, operatorHeaders()),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
                toast.success('Report updated successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to update report: ${error.message}`);
            },
        });
    };

    const useDeleteReport = () => {
        return useMutation({
            mutationFn: (id: number) =>
                api.delete(`/custom-reports/${id}`, operatorHeaders()),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
                toast.success('Report deleted successfully');
            },
            onError: (error: Error) => {
                toast.error(`Failed to delete report: ${error.message}`);
            },
        });
    };

    return { useGetReports, useGetReport, useCreateReport, useUpdateReport, useDeleteReport };
};
