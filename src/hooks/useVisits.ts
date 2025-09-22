
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useRoleAccess } from './useRoleAccess';

export type Visit = Tables<'visits'>;
export type VisitInsert = TablesInsert<'visits'>;
export type VisitUpdate = TablesUpdate<'visits'>;

export interface GroupedVisit {
  leadId: string;
  lead: {
    id: string;
    store_name: string;
    company_name: string | null;
    contact_person: string | null;
    phone_number: string | null;
    email: string | null;
    salesperson: string | null;
    territory_id: string | null;
  };
  visitCount: number;
  lastVisit: Visit;
  allVisits: Visit[];
  lastModified: string;
}

export const useVisits = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { userRole, isAdmin, isManager, isSalesperson } = useRoleAccess();

  return useQuery({
    queryKey: ['visits', user?.id, userRole],
    queryFn: async () => {
      console.log('Fetching visits from visits table...');
      console.log('Current user:', { id: user?.id, email: user?.email, role: userRole });
      console.log('User profile:', profile);
      
      let query = supabase
        .from('visits')
        .select(`
          *,
          leads (
            id,
            store_name,
            company_name,
            contact_person,
            phone_number,
            email,
            salesperson,
            territory_id,
            postal_code
          )
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (isManager) {
        // Managers can only see visits from their team members
        console.log('Manager accessing team visits');
        query = query.eq('manager_id', user?.id);
      } else if (isAdmin) {
        // Admins can see all visits
        console.log('Admin accessing all visits');
      } else {
        // Other roles (analyst, viewer) - same as managers
        console.log('Other role accessing all visits');
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching visits:', error);
        throw error;
      }
      
      console.log('Successfully fetched visits:', data?.length || 0, 'records');
      console.log('Sample fetched visits:', data?.slice(0, 3).map(visit => ({
        id: visit.id,
        lead_name: visit.leads?.store_name,
        salesperson: visit.salesperson,
        manager_id: visit.manager_id
      })));
      
      // Apply salesperson filtering in JavaScript for better reliability
      let filteredData = data;
      if (isSalesperson) {
        const salespersonName = profile?.name || user?.email || 'Unknown';
        const salespersonEmail = user?.email;
        
        filteredData = data?.filter(visit => 
          visit.salesperson === salespersonName || visit.salesperson === salespersonEmail
        ) || [];
      }
      
      // Group visits by lead
      const groupedVisits = new Map<string, GroupedVisit>();
      
      filteredData?.forEach((visit) => {
        const leadId = visit.leads?.id;
        if (!leadId) return;
        
        if (!groupedVisits.has(leadId)) {
          groupedVisits.set(leadId, {
            leadId,
            lead: visit.leads!,
            visitCount: 0,
            lastVisit: visit,
            allVisits: [],
            lastModified: visit.created_at || ''
          });
        }
        
        const group = groupedVisits.get(leadId)!;
        group.visitCount++;
        group.allVisits.push(visit);
        
        // Update last visit if this one is more recent
        if (new Date(visit.created_at || '') > new Date(group.lastVisit.created_at || '')) {
          group.lastVisit = visit;
          group.lastModified = visit.created_at || '';
        }
      });
      
      // Convert to array and sort by last modified
      const result = Array.from(groupedVisits.values()).sort((a, b) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      
      return result;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - visits change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useCreateVisit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isManager, isSalesperson } = useRoleAccess();
  
  return useMutation({
    mutationFn: async (visit: VisitInsert) => {
      let managerId = visit.manager_id;
      
      if (isManager) {
        // If current user is a manager, set their ID as manager_id
        managerId = user?.id;
      } else if (isSalesperson) {
        // If current user is a salesperson, get their assigned manager_id
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('manager_id')
          .eq('id', user?.id)
          .single();
        
        managerId = currentProfile?.manager_id || null;
      }
      
      // Add manager_id to the visit data
      const visitData = {
        ...visit,
        manager_id: managerId
      };
      
      const { data, error } = await supabase
        .from('visits')
        .insert(visitData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating visit:', error);
        throw error;
      }

      // If visit has notes, append them to the lead's notes field
      if (visit.notes && visit.notes.trim() && visit.lead_id) {
        try {
          // Get current lead notes
          const { data: currentLead, error: leadError } = await supabase
            .from('leads')
            .select('notes')
            .eq('id', visit.lead_id)
            .single();

          if (leadError) {
            console.error('Error fetching lead notes:', leadError);
          } else {
            // Create timestamp for the visit note
            const visitTimestamp = new Date().toLocaleString();
            const salesperson = visit.salesperson || 'Unknown';
            
            // Format the visit note
            const visitNote = `\n\n[${visitTimestamp}] Visit by ${salesperson}:\n${visit.notes.trim()}`;
            
            // Append to existing notes or create new notes
            const updatedNotes = currentLead?.notes 
              ? currentLead.notes + visitNote
              : visitNote.trim();

            // Update the lead's notes field
            const { error: updateError } = await supabase
              .from('leads')
              .update({ notes: updatedNotes })
              .eq('id', visit.lead_id);

            if (updateError) {
              console.error('Error updating lead notes:', updateError);
            } else {
              console.log('Successfully added visit notes to lead');
            }
          }
        } catch (error) {
          console.error('Error processing visit notes:', error);
          // Don't throw error here - visit was created successfully
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      // Invalidate visit count queries for leads
      queryClient.invalidateQueries({ queryKey: ['leads', 'visitCount'] });
      // Invalidate leads to refresh notes
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Invalidate dashboard and analytics data
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      // Force refetch to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ['visits'] });
      queryClient.refetchQueries({ queryKey: ['leads'] });
    },
  });
};

export const useUpdateVisit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: VisitUpdate }) => {
      const { data, error } = await supabase
        .from('visits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating visit:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      // Invalidate visit count queries for leads
      queryClient.invalidateQueries({ queryKey: ['leads', 'visitCount'] });
      // Invalidate leads to refresh notes
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Invalidate dashboard and analytics data
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      // Force refetch to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ['visits'] });
      queryClient.refetchQueries({ queryKey: ['leads'] });
    },
  });
};

export const useDeleteVisit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting visit:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      // Invalidate visit count queries for leads
      queryClient.invalidateQueries({ queryKey: ['leads', 'visitCount'] });
      // Invalidate leads to refresh notes
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Invalidate dashboard and analytics data
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      // Force refetch to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ['visits'] });
      queryClient.refetchQueries({ queryKey: ['leads'] });
    },
  });
};

export const useBulkUpdateVisits = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: VisitUpdate }) => {
      const { data, error } = await supabase
        .from('visits')
        .update(updates)
        .in('id', ids)
        .select();
      
      if (error) {
        console.error('Error bulk updating visits:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
};

export const useBulkDeleteVisits = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('visits')
        .delete()
        .in('id', ids);
      
      if (error) {
        console.error('Error bulk deleting visits:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
};
