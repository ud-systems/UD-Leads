
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Supplier = Tables<'suppliers'>;
export type SupplierInsert = TablesInsert<'suppliers'>;
export type SupplierUpdate = TablesUpdate<'suppliers'>;

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching suppliers:', error);
        throw error;
      }
      
      return data;
    },
  });
};

export const useSearchSuppliers = (searchTerm: string) => {
  return useQuery({
    queryKey: ['suppliers', 'search', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true })
        .limit(10);
      
      if (error) {
        console.error('Error searching suppliers:', error);
        throw error;
      }
      
      return data;
    },
    enabled: searchTerm.length > 0,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplier: SupplierInsert) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating supplier:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SupplierUpdate }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating supplier:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting supplier:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useLeadSuppliers = (leadId: string) => {
  return useQuery({
    queryKey: ['leads', leadId, 'suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_lead_suppliers', { lead_id_param: leadId });
      
      if (error) {
        console.error('Error fetching lead suppliers:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!leadId,
  });
};

export const useUpdateLeadSuppliers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, supplierIds }: { leadId: string; supplierIds: string[] }) => {
      const { error } = await supabase
        .rpc('add_suppliers_to_lead', { 
          lead_id_param: leadId, 
          supplier_ids: supplierIds 
        });
      
      if (error) {
        console.error('Error updating lead suppliers:', error);
        throw error;
      }
    },
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};
