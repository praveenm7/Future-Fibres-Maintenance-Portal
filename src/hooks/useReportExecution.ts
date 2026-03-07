import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ReportDefinition, ReportExecutionResult } from '@/types/reportBuilder';

export const usePreviewReport = () => {
    return useMutation({
        mutationFn: ({ definition, limit }: { definition: ReportDefinition; limit?: number }) =>
            api.query<ReportExecutionResult>('/custom-reports/preview', { definition, limit }),
    });
};

export const useExecuteReport = () => {
    return useMutation({
        mutationFn: ({ id, limit }: { id: number; limit?: number }) =>
            api.query<ReportExecutionResult>(`/custom-reports/${id}/execute`, { limit }),
    });
};
