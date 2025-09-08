import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type LeadNote = Tables<'lead_notes'>;
export type LeadNoteInsert = TablesInsert<'lead_notes'>;
export type LeadNoteUpdate = TablesUpdate<'lead_notes'>;

export const useLeadNotes = (leadId: string) => {
  const { user } = useAuth();
  const { isAdmin, isManager, isSalesperson } = useRoleAccess();
  
  return useQuery({
    queryKey: ['leadNotes', leadId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching lead notes for lead:', leadId);
      console.log('Current user:', user);
      
      let query = supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching lead notes:', error);
        throw error;
      }
      
      console.log('Successfully fetched lead notes:', data?.length || 0, 'records');
      return data || [];
    },
    enabled: !!user?.id && !!leadId,
  });
};

export const useCreateLeadNote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (note: LeadNoteInsert) => {
      const noteData = {
        ...note,
        created_by: user?.id || null,
        created_by_name: user?.email || 'Unknown',
        created_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('lead_notes')
        .insert(noteData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating lead note:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Invalidate lead notes for the specific lead
      queryClient.invalidateQueries({ queryKey: ['leadNotes', data.lead_id] });
    },
  });
};

export const useUpdateLeadNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: LeadNoteUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('lead_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating lead note:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Invalidate lead notes for the specific lead
      queryClient.invalidateQueries({ queryKey: ['leadNotes', data.lead_id] });
    },
  });
};

export const useDeleteLeadNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First get the lead_id before deleting
      const { data: note } = await supabase
        .from('lead_notes')
        .select('lead_id')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('lead_notes')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting lead note:', error);
        throw error;
      }
      
      return { id, lead_id: note?.lead_id };
    },
    onSuccess: (data) => {
      // Invalidate lead notes for the specific lead
      if (data.lead_id) {
        queryClient.invalidateQueries({ queryKey: ['leadNotes', data.lead_id] });
      }
    },
  });
};
