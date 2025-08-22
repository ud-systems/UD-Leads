
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export type UserPreferences = Tables<'user_preferences'>;
export type UserPreferencesInsert = TablesInsert<'user_preferences'>;
export type UserPreferencesUpdate = TablesUpdate<'user_preferences'>;

export const useUserPreferences = (userId?: string) => {
  const { user } = useAuth();
  const { data: currentProfile } = useProfile(user?.id);
  const isAdmin = currentProfile?.role === 'admin';
  const isOwnPreferences = userId === user?.id || !userId;

  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['user_preferences', userId],
    queryFn: async () => {
      if (!userId && !user?.id) {
        // Return default preferences when no user ID is provided
        return {
          user_id: null,
          primary_color: '#3b82f6', // Blue
          accent_color: '#10b981', // Jungle Green
          secondary_color: '#f1f5f9', // Slate
          active_color: '#22c55e', // Green
          inactive_color: '#ef4444', // Red
          daily_visit_target: 15,
        };
      }
      
      const targetUserId = userId || user?.id;
      const client = (isAdmin && !isOwnPreferences) ? supabaseAdmin : supabase;
      
      // First try to get existing preferences
      const { data, error } = await client
        .from('user_preferences')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user preferences:', error);
        // Return defaults if fetch fails
        return {
          user_id: targetUserId,
          primary_color: '#3b82f6', // Blue
          accent_color: '#10b981', // Jungle Green
          secondary_color: '#f1f5f9', // Slate
          active_color: '#22c55e', // Green
          inactive_color: '#ef4444', // Red
          daily_visit_target: 15,
        };
      }
      
      // If preferences exist, return them
      if (data) {
        return data;
      }
      
      // If no preferences exist, return defaults (don't create them here)
      // The handle_new_user function should create them automatically
      return {
        user_id: targetUserId,
        primary_color: '#3b82f6', // Blue
        accent_color: '#10b981', // Jungle Green
        secondary_color: '#f1f5f9', // Slate
        active_color: '#22c55e', // Green
        inactive_color: '#ef4444', // Red
        daily_visit_target: 15,
      };
    },
    enabled: true, // Always enabled, but we handle the no-user case in queryFn
    retry: (failureCount, error) => {
      return failureCount < 2; // Only retry once
    },
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: UserPreferencesUpdate }) => {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user_preferences', data.user_id] });
    },
  });
};

export const useCreateUserPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (preferences: UserPreferencesInsert) => {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert(preferences)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user preferences:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user_preferences', data.user_id] });
    },
  });
};

export const useUpsertUserPreferences = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentProfile } = useProfile(user?.id);
  const isAdmin = currentProfile?.role === 'admin';
  const isManager = currentProfile?.role === 'manager';
  
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<UserPreferencesUpdate> }) => {
      const isOwnPreferences = userId === user?.id;
      const client = ((isAdmin || isManager) && !isOwnPreferences) ? supabaseAdmin : supabase;
      
      // First check if preferences exist
      const { data: existingData } = await client
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      let result;
      
      if (existingData) {
        // Update existing preferences
        const { data, error } = await client
          .from('user_preferences')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating user preferences:', error);
          throw error;
        }
        
        result = data;
      } else {
        // Create new preferences with defaults
        const newPreferences = {
          user_id: userId,
          primary_color: '#3b82f6',
          accent_color: '#10b981',
          secondary_color: '#f1f5f9',
          active_color: '#22c55e',
          inactive_color: '#ef4444',
          daily_visit_target: 15,
          ...updates
        };
        
        const { data, error } = await client
          .from('user_preferences')
          .insert(newPreferences)
          .select()
          .single();
        
        if (error) {
          console.error('Error creating user preferences:', error);
          throw error;
        }
        
        result = data;
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user_preferences', data.user_id] });
    },
  });
};
