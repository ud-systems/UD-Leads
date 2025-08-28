import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ConversionRule = Tables<'conversion_rules'>;
export type ConversionRuleInsert = TablesInsert<'conversion_rules'>;
export type ConversionRuleUpdate = TablesUpdate<'conversion_rules'>;

// Hook to fetch all conversion rules
export const useConversionRules = () => {
  return useQuery({
    queryKey: ['conversion_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversion_rules')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversion rules:', error);
        // Return empty array instead of throwing error
        return [];
      }
      
      return data || [];
    },
  });
};

// Hook to fetch the default conversion rule
export const useDefaultConversionRule = () => {
  return useQuery({
    queryKey: ['conversion_rules', 'default'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversion_rules')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching default conversion rule:', error);
        // Return null instead of throwing error
        return null;
      }
      
      return data;
    },
  });
};

// Hook to create a new conversion rule
export const useCreateConversionRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rule: ConversionRuleInsert) => {
      const { data, error } = await supabase
        .from('conversion_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating conversion rule:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion_rules'] });
    },
  });
};

// Hook to update a conversion rule
export const useUpdateConversionRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & ConversionRuleUpdate) => {
      const { data, error } = await supabase
        .from('conversion_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating conversion rule:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion_rules'] });
    },
  });
};

// Hook to delete a conversion rule
export const useDeleteConversionRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('conversion_rules')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting conversion rule:', error);
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion_rules'] });
    },
  });
};

// Hook to set a rule as default
export const useSetDefaultConversionRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      // First, unset all other default rules
      await supabase
        .from('conversion_rules')
        .update({ is_default: false })
        .eq('is_default', true);
      
      // Then set the new default rule
      const { data, error } = await supabase
        .from('conversion_rules')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error setting default conversion rule:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion_rules'] });
    },
  });
};

// Hook to fetch conversion history for leads
export const useConversionHistory = (leadIds?: string[]) => {
  return useQuery({
    queryKey: ['conversion_history', leadIds],
    queryFn: async () => {
      let query = supabase
        .from('lead_status_history')
        .select('*')
        .eq('conversion_counted', true)
        .order('changed_at', { ascending: false });
      
      if (leadIds && leadIds.length > 0) {
        query = query.in('lead_id', leadIds);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching conversion history:', error);
        // Return empty array instead of throwing error
        return [];
      }
      
      return data || [];
    },
    enabled: !leadIds || leadIds.length > 0,
  });
};

// Utility function to calculate conversion rate using conversion history
export const calculateConversionRate = (
  leads: any[], 
  conversionHistory: any[]
): number => {
  const totalLeads = leads.length;
  if (totalLeads === 0) return 0;
  
  const convertedLeads = new Set(
    conversionHistory.map(conv => conv.lead_id)
  ).size;
  
  return (convertedLeads / totalLeads) * 100;
};

// Utility function to calculate conversion rate using the default rule
export const calculateDefaultConversionRate = (leads: any[]): number => {
  // Fallback to legacy behavior if no conversion history exists
  const convertedLeads = leads.filter(l => l.status === 'Converted').length;
  const totalLeads = leads.length;
  
  return totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
};

// Utility function to get converted leads count using conversion history
export const getConvertedLeadsCount = (
  leads: any[], 
  conversionHistory: any[]
): number => {
  const convertedLeadIds = new Set(
    conversionHistory.map(conv => conv.lead_id)
  );
  
  return leads.filter(lead => 
    convertedLeadIds.has(lead.id)
  ).length;
};

// Utility function to get converted leads using conversion history
export const getConvertedLeads = (
  leads: any[], 
  conversionHistory: any[]
): any[] => {
  const convertedLeadIds = new Set(
    conversionHistory.map(conv => conv.lead_id)
  );
  
  return leads.filter(lead => 
    convertedLeadIds.has(lead.id)
  );
};
