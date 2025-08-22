import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSalespersonOptions = () => {
  return useQuery({
    queryKey: ['salesperson_options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .in('role', ['salesperson', 'manager', 'admin'])
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching salesperson options:', error);
        throw error;
      }
      
      return data?.map(profile => ({
        id: profile.id,
        name: profile.name || profile.email || 'Unknown',
        email: profile.email,
        role: profile.role
      })) || [];
    },
  });
}; 