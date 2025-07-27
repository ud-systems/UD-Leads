import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCompanyLogo = () => {
  return useQuery({
    queryKey: ['company-logo'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'company_logo_url')
          .single();
        
        if (error) {
          console.error('Error fetching company logo:', error);
          return '';
        }
        
        return data?.setting_value || '';
      } catch (error) {
        console.error('Error fetching company logo:', error);
        return '';
      }
    },
    retry: 1,
    retryDelay: 1000,
  });
};

export const useUpdateCompanyLogo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (logoUrl: string) => {
      try {
        // First try to update existing record
        const { data: updateData, error: updateError } = await supabase
          .from('system_settings')
          .update({
            setting_value: logoUrl,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'company_logo_url')
          .select()
          .single();
        
        if (updateError && updateError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Update error:', updateError);
          throw updateError;
        }
        
        if (updateData) {
          return updateData;
        }
        
        // If no record exists, insert new one
        const { data: insertData, error: insertError } = await supabase
          .from('system_settings')
          .insert({
            setting_key: 'company_logo_url',
            setting_value: logoUrl,
            description: 'Company logo URL (150x150px recommended)'
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
        
        return insertData;
      } catch (error) {
        console.error('Error updating company logo:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-logo'] });
    },
  });
}; 