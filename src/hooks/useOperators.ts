import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Operator } from '@/types/maintenance';

export const useOperators = () => {
    const useGetOperators = () => {
        return useQuery({
            queryKey: ['operators'],
            queryFn: () => api.get<Operator[]>('/operators'),
        });
    };

    return { useGetOperators };
};
