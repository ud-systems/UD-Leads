import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useRoleAccess } from './useRoleAccess';
import { toUKDateTime, getUKDateTime } from '@/utils/timeUtils';

export type Lead = Tables<'leads'>;
export type LeadInsert = TablesInsert<'leads'>;
export type LeadUpdate = TablesUpdate<'leads'>;

export const useLeads = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { userRole, isAdmin, isManager, isSalesperson } = useRoleAccess();

  return useQuery({
    queryKey: ['leads', user?.id, userRole],
    queryFn: async () => {
      console.log('Fetching leads from leads table...');
      console.log('Current user:', { id: user?.id, email: user?.email, role: userRole });
      console.log('User profile:', profile);
      
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // Temporarily disable role-based filtering for debugging
      console.log('Current user role:', { isManager, isAdmin, isSalesperson, userId: user?.id });
      
      // Apply role-based filtering
      if (isManager) {
        // Managers can see BOTH their historical leads AND team leads
        console.log('Manager accessing hybrid leads (historical + team)');
        const managerName = profile?.name || user?.email || 'Unknown';
        query = query.or(`manager_id.eq.${user?.id},salesperson.eq.${managerName}`);
      } else if (isAdmin) {
        // Admins can see all leads
        console.log('Admin accessing all leads');
      } else if (isSalesperson) {
        // Salespeople can see their own leads and leads without manager_id
        console.log('Salesperson accessing leads');
        // Don't filter by manager_id for salespeople - let JavaScript filtering handle it
      } else {
        // Other roles (analyst, viewer) - same as managers
        console.log('Other role accessing all leads');
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching leads:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Successfully fetched leads:', data?.length || 0, 'records');
      console.log('Sample fetched leads:', data?.slice(0, 3).map(lead => ({
        id: lead.id,
        store_name: lead.store_name,
        salesperson: lead.salesperson,
        manager_id: lead.manager_id
      })));
      
      // Apply salesperson filtering in JavaScript for better reliability
      let filteredData = data;
      if (isSalesperson) {
        const salespersonName = profile?.name || user?.email || 'Unknown';
        const salespersonEmail = user?.email;
        
        filteredData = data?.filter(lead => 
          lead.salesperson === salespersonName || lead.salesperson === salespersonEmail
        ) || [];
      }
      
      return filteredData;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - leads change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isManager, isSalesperson } = useRoleAccess();
  
  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      console.log('Attempting to create lead:', lead);
      
      let managerId = lead.manager_id;
      
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
      
      // Add manager_id to the lead data
      const leadData = {
        ...lead,
        manager_id: managerId
      };
      
      // Start a transaction to create lead and initial visit
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();
      
      if (leadError) {
        console.error('Error creating lead:', leadError);
        console.error('Lead data that failed:', lead);
        throw leadError;
      }

      // Auto-create initial visit using the form submission time in UK timezone
      // Use form_submit_time if available, otherwise fall back to current UK time
      const formSubmitTime = lead.form_submit_time || getUKDateTime().iso;
      
      // If form_submit_time is already in UK timezone format, use it directly
      // Otherwise, convert to UK timezone
      let currentDate: string;
      let currentTime: string;
      
      if (formSubmitTime && formSubmitTime.includes('+00:00')) {
        // Already in UK timezone format, extract date and time directly
        currentDate = formSubmitTime.split('T')[0];
        currentTime = formSubmitTime.split('T')[1].split('+')[0];
      } else {
        // Convert to UK timezone
        const ukDateTime = toUKDateTime(formSubmitTime);
        currentDate = ukDateTime.date;
        currentTime = ukDateTime.time;
      }
      
      // Check if a visit already exists for this lead today to prevent duplicates
      const { data: existingVisit, error: checkError } = await supabase
        .from('visits')
        .select('id')
        .eq('lead_id', newLead.id)
        .eq('date', currentDate)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking for existing visit:', checkError);
      }
      
      // Only create visit if none exists for today
      if (!existingVisit) {
        // Create enhanced notes for the initial visit
        const visitNotes = lead.notes 
          ? `Initial Discovery - ${lead.notes}`
          : `Initial Discovery - Lead discovered during field visit. Store: ${lead.store_name || 'Unknown'}`;
        
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .insert({
            lead_id: newLead.id,
            date: currentDate,
            time: currentTime,
            status: 'completed',
            salesperson: profile?.name || user?.email || 'Unknown',
            manager_id: managerId,
            notes: visitNotes
          })
          .select()
          .single();

        if (visitError) {
          console.error('Error creating initial visit:', visitError);
          // Try to delete the lead if visit creation fails
          await supabase.from('leads').delete().eq('id', newLead.id);
          throw new Error(`Failed to create initial visit: ${visitError.message}`);
        }
        
        console.log('Successfully created lead and initial visit:', { lead: newLead.id, visit: visitData?.id });
      } else {
        console.log('Visit already exists for this lead today, skipping visit creation');
      }
      return newLead;
    },
    onSuccess: () => {
      // Use safe invalidation to prevent race conditions
      const queryKeys = [
        ['leads'],
        ['visits'],
        ['leads', 'visitCount'],
        ['targets'],
        ['users'],
        ['territories']
      ];
      
      // Debounce invalidation to prevent overwhelming the system
      setTimeout(() => {
        queryKeys.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }, 100);
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LeadUpdate }) => {
      console.log('Updating lead:', { id, updates });
      
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating lead:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', 'visitCount'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting lead:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['leads', 'visitCount'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });
};

export const useBulkUpdateLeads = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: LeadUpdate }) => {
      // Validate input
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('Invalid or empty IDs array provided');
      }

      // Filter out any invalid IDs
      const validIds = ids.filter(id => id && typeof id === 'string' && id.trim() !== '');
      
      if (validIds.length === 0) {
        throw new Error('No valid IDs provided for update');
      }

      console.log('Bulk updating leads with IDs:', validIds, 'Updates:', updates);

      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .in('id', validIds)
        .select();
      
      if (error) {
        console.error('Error bulk updating leads:', error);
        throw error;
      }
      
      console.log('Successfully updated leads:', data?.length || 0);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', 'visitCount'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });
};

export const useBulkDeleteLeads = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Validate input
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('Invalid or empty IDs array provided');
      }

      // Filter out any invalid IDs
      const validIds = ids.filter(id => id && typeof id === 'string' && id.trim() !== '');
      
      if (validIds.length === 0) {
        throw new Error('No valid IDs provided for deletion');
      }

      console.log('Bulk deleting leads with IDs:', validIds);

      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', validIds);
      
      if (error) {
        console.error('Error bulk deleting leads:', error);
        throw error;
      }

      console.log('Successfully deleted leads:', validIds.length);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['leads', 'visitCount'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });
};

// Hook to get visit count for a lead
export const useLeadVisitCount = (leadId: string) => {
  return useQuery({
    queryKey: ['leads', leadId, 'visitCount'],
    queryFn: async () => {
      if (!leadId) return 0;
      
      const { count, error } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('lead_id', leadId);
      
      if (error) {
        console.error('Error fetching visit count for lead', leadId, ':', error);
        throw error;
      }
      
      console.log(`Visit count for lead ${leadId}:`, count || 0);
      return count || 0;
    },
    enabled: !!leadId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
  });
}; 