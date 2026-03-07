import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Operator } from '@/types/maintenance';
import { useEntityId } from '@/contexts/EntityContext';

export const useOperators = () => {
    const entityId = useEntityId();
    const useGetOperators = () => {
        return useQuery({
            queryKey: ['operators', { entityId }],
            queryFn: () => api.get<Operator[]>('/operators'),
        });
    };

    return { useGetOperators };
};
