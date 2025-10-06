import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/adminClient';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export type User = Tables<'profiles'>;
export type UserInsert = TablesInsert<'profiles'>;
export type UserUpdate = TablesUpdate<'profiles'>;

export interface UserWithPreferences extends User {
  user_preferences?: {
    daily_visit_target: number | null;
  } | null;
}

export const useUsers = () => {
  const { user } = useAuth();
  const { data: currentProfile } = useProfile(user?.id);
  const isAdmin = currentProfile?.role === 'admin';
  const isManager = currentProfile?.role === 'manager';
  const adminConfigured = isAdminClientConfigured();

  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        console.log('Fetching users...', { isAdmin, adminConfigured });
        
        // Use admin client for admin users, regular client for others
        const client = (isAdmin && adminConfigured) ? supabaseAdmin : supabase;
        
        // Build query based on role
        let query = client
          .from('profiles')
          .select('*')
          .order('name', { ascending: true });
        
        // Apply role-based filtering
        if (isManager) {
          // Managers can only see their team members and themselves
          query = query.or(`manager_id.eq.${user?.id},id.eq.${user?.id}`);
        }
        // Admins can see all users (no additional filtering needed)
        
        const { data: users, error: usersError } = await query;
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
          throw usersError;
        }

        console.log('Users fetched successfully:', users?.length || 0);

        // Get all user preferences in a single query for better performance
        const userIds = users.map(user => user.id);
        const { data: allPreferences, error: prefError } = await client
          .from('user_preferences')
          .select('user_id, daily_visit_target')
          .in('user_id', userIds);

        if (prefError) {
          console.warn('Error fetching user preferences:', prefError);
        }

        // Create a map for quick lookup
        const preferencesMap = new Map();
        allPreferences?.forEach(pref => {
          preferencesMap.set(pref.user_id, { daily_visit_target: pref.daily_visit_target });
        });

        // Combine users with their preferences
        const usersWithPreferences = users.map(user => ({
          ...user,
          user_preferences: preferencesMap.get(user.id) || null
        }));
        
        console.log('Users with preferences processed:', usersWithPreferences.length);
        return usersWithPreferences as UserWithPreferences[];
      } catch (error) {
        console.error('Error in useUsers queryFn:', error);
        throw error;
      }
    },
    enabled: !!user, // Only run when user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes - users don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      console.log('useUsers retry attempt:', failureCount, error);
      return failureCount < 2; // Only retry once
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentProfile } = useProfile(user?.id);
  const isAdmin = currentProfile?.role === 'admin';
  const isManager = currentProfile?.role === 'manager';
  const adminConfigured = isAdminClientConfigured();
  
  return useMutation({
    mutationFn: async (userData: { email: string; password: string; name: string; role: string; manager_id?: string | null; daily_visit_target?: number }) => {
      if (!isAdmin && !isManager) {
        throw new Error('Only admins and managers can create users');
      }

      if (!adminConfigured) {
        throw new Error('Admin client not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file');
      }

      console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });

      try {
        // Step 1: Create the user in Supabase Auth
        console.log('Creating user in Supabase Auth...');
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            role: userData.role,
            admin_created: 'true' // This prevents the trigger from running
          }
        });

        if (authError) {
          console.error('Error creating user in auth:', authError);
          throw authError;
        }

        if (!authUser.user) {
          throw new Error('Failed to create user in auth system');
        }

        console.log('User created in auth, ID:', authUser.user.id);

        // Step 2: Create the profile directly using admin client
        console.log('Creating profile...');
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authUser.user.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            manager_id: userData.manager_id
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating profile:', profileError);
          
          // If profile creation fails, we should clean up the auth user
          try {
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            console.log('Cleaned up auth user after profile creation failure');
          } catch (cleanupError) {
            console.error('Failed to clean up auth user:', cleanupError);
          }
          
          throw profileError;
        }

        // Step 3: Create user preferences
        console.log('Creating user preferences...');
        const { error: preferencesError } = await supabaseAdmin
          .from('user_preferences')
          .insert({
            user_id: authUser.user.id,
            primary_color: '#3b82f6',
            accent_color: '#10b981',
            secondary_color: '#f1f5f9',
            active_color: '#22c55e',
            inactive_color: '#ef4444',
            daily_visit_target: userData.daily_visit_target || 15 // Will be overridden by system default when used
          });

        if (preferencesError) {
          console.error('Error creating preferences:', preferencesError);
          
          // Clean up profile and auth user
          try {
            await supabaseAdmin.from('profiles').delete().eq('id', authUser.user.id);
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            console.log('Cleaned up after preferences creation failure');
          } catch (cleanupError) {
            console.error('Failed to clean up after preferences error:', cleanupError);
          }
          
          throw preferencesError;
        }

        console.log('User created successfully:', profile);
        return profile;
      } catch (error) {
        console.error('Error in useCreateUser mutationFn:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentProfile } = useProfile(user?.id);
  const isAdmin = currentProfile?.role === 'admin';
  const isManager = currentProfile?.role === 'manager';
  const adminConfigured = isAdminClientConfigured();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UserUpdate }) => {
      if (!isAdmin && !isManager) {
        throw new Error('Only admins and managers can update users');
      }

      if (!adminConfigured) {
        throw new Error('Admin client not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file');
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentProfile } = useProfile(user?.id);
  const isAdmin = currentProfile?.role === 'admin';
  const isManager = currentProfile?.role === 'manager';
  const adminConfigured = isAdminClientConfigured();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!isAdmin && !isManager) {
        throw new Error('Only admins and managers can delete users');
      }

      if (!adminConfigured) {
        throw new Error('Admin client not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file');
      }

      console.log('Deleting user with ID:', id);

      try {
        // Step 1: Delete user preferences first (if they exist)
        console.log('Deleting user preferences...');
        const { error: preferencesError } = await supabaseAdmin
          .from('user_preferences')
          .delete()
          .eq('user_id', id);
        
        if (preferencesError) {
          console.warn('Error deleting user preferences (may not exist):', preferencesError);
        }

        // Step 2: Delete the profile
        console.log('Deleting user profile...');
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', id);
        
        if (profileError) {
          console.error('Error deleting user profile:', profileError);
          throw profileError;
        }

        // Step 3: Delete the user from Supabase Auth
        console.log('Deleting user from auth...');
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        
        if (authError) {
          console.error('Error deleting user from auth:', authError);
          throw authError;
        }

        console.log('User deleted successfully');
        return { success: true };
      } catch (error) {
        console.error('Error in user deletion process:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}; 

// Test function to check admin client access
export const testAdminAccess = async () => {
  try {
    console.log('Testing admin client access...');
    
    // Test basic query
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Admin client test failed:', error);
      return { success: false, error };
    }
    
    console.log('Admin client test successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Admin client test exception:', error);
    return { success: false, error };
  }
}; 

// Test function to check database access
export const testDatabaseAccess = async () => {
  try {
    console.log('Testing database access...');
    
    // Test basic query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database access test failed:', error);
      return { success: false, error };
    }
    
    console.log('Database access test successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Database access test exception:', error);
    return { success: false, error };
  }
}; 