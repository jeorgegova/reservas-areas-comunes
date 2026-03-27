import { useQuery } from '@tanstack/react-query';
import { getCommonAreas } from '@/services/commonAreas';

export const useCommonAreasQuery = (orgId?: string) => {
  return useQuery({
    queryKey: ['commonAreas', orgId],
    queryFn: () => getCommonAreas(orgId!),
    enabled: !!orgId,
  });
};
