import { supabase } from '@/lib/supabase';

export const getOrganization = async (orgId: string) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, address, phone, logo_url, login_photo_url, contact_email, subscription_status')
    .eq('id', orgId)
    .single();

  if (error) throw error;
  return data;
};
