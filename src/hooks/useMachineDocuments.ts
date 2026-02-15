import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { MachineDocument } from '@/types/maintenance';
import { toast } from 'sonner';

export const useMachineDocuments = () => {
    const queryClient = useQueryClient();

    const useGetDocuments = (machineId?: string) => {
        return useQuery({
            queryKey: ['machine-documents', { machineId }],
            queryFn: () => {
                const params = new URLSearchParams();
                if (machineId) params.append('machineId', machineId);
                return api.get<MachineDocument[]>(`/documents?${params}`);
            },
            enabled: !!machineId,
        });
    };

    const useUploadPhoto = () => {
        return useMutation({
            mutationFn: ({ machineId, file }: { machineId: string; file: File }) => {
                const formData = new FormData();
                formData.append('photo', file);
                return api.upload<{ imageUrl: string }>(`/machines/${machineId}/photo`, formData);
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['machines'] });
                toast.success('Photo uploaded successfully');
            },
            onError: (error: Error) => {
                toast.error(`Photo upload failed: ${error.message}`);
            },
        });
    };

    const useUploadDocument = () => {
        return useMutation({
            mutationFn: (formData: FormData) =>
                api.upload<MachineDocument>('/documents', formData),
            onSuccess: (_, variables) => {
                queryClient.invalidateQueries({ queryKey: ['machine-documents'] });
                const category = variables.get('category');
                toast.success(`${category === 'MANUAL' ? 'Manual' : 'Document'} uploaded successfully`);
            },
            onError: (error: Error) => {
                toast.error(`Upload failed: ${error.message}`);
            },
        });
    };

    const useDeleteDocument = () => {
        return useMutation({
            mutationFn: (id: string) => api.delete(`/documents/${id}`),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['machine-documents'] });
                toast.success('Document deleted');
            },
            onError: (error: Error) => {
                toast.error(`Delete failed: ${error.message}`);
            },
        });
    };

    return { useGetDocuments, useUploadPhoto, useUploadDocument, useDeleteDocument };
};
