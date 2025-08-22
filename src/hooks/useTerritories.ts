
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Territory = {
  id: string;
  city: string;
  country?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type TerritoryInsert = TablesInsert<'territories'>;
export type TerritoryUpdate = TablesUpdate<'territories'>;

export const useTerritories = () => {
  return useQuery({
    queryKey: ['territories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('territories')
        .select('*')
        .order('city', { ascending: true });
      
      if (error) {
        console.error('Error fetching territories:', error);
        throw error;
      }
      
      return data;
    },
  });
};

export const useSearchTerritories = (searchTerm: string) => {
  return useQuery({
    queryKey: ['territories', 'search', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('territories')
        .select('*')
        .ilike('city', `%${searchTerm}%`)
        .order('city', { ascending: true })
        .limit(10);
      
      if (error) {
        console.error('Error searching territories:', error);
        throw error;
      }
      
      return data;
    },
    enabled: searchTerm.length > 0,
  });
};

export const useCreateTerritory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (territory: TerritoryInsert) => {
      const { data, error } = await supabase
        .from('territories')
        .insert(territory)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating territory:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
    },
  });
};

export const useUpdateTerritory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TerritoryUpdate }) => {
      const { data, error } = await supabase
        .from('territories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating territory:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
    },
  });
};

export const useDeleteTerritory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('territories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting territory:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
    },
  });
};

export const useBulkUpdateTerritories = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: TerritoryUpdate }) => {
      const { data, error } = await supabase
        .from('territories')
        .update(updates)
        .in('id', ids)
        .select();
      
      if (error) {
        console.error('Error bulk updating territories:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
    },
  });
};

export const useBulkDeleteTerritories = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('territories')
        .delete()
        .in('id', ids);
      
      if (error) {
        console.error('Error bulk deleting territories:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
    },
  });
};
