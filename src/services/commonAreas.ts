import { supabase } from '@/lib/supabase';

export const getCommonAreas = async (orgId: string) => {
  const { data, error } = await supabase
    .from('common_areas')
    .select('id, name, description, max_hours_per_reservation, cost_per_hour, image_url, is_active, pricing_type, is_free, organization_id')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
};
