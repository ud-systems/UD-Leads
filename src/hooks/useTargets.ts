import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Target {
  id: string;
  user_id: string;
  target_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  metric_type: 'visits';
  target_value: number;
  achieved_value: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface TargetAchievement {
  target_id: string;
  user_id: string;
  target_type: string;
  metric_type: string;
  target_value: number;
  achieved_value: number;
  achievement_percentage: number;
  period_start: string;
  period_end: string;
  is_completed: boolean;
}

export function useTargets(userId?: string) {
  return useQuery({
    queryKey: ['targets', userId],
    queryFn: async (): Promise<Target[]> => {
      // Return empty array since targets table doesn't exist
      // TODO: Create targets table migration when needed
      return [];
    },
    enabled: !!userId,
  });
}

export function useTargetAchievements(userId?: string, timeRange: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') {
  return useQuery({
    queryKey: ['target-achievements', userId, timeRange],
    queryFn: async (): Promise<TargetAchievement[]> => {
      // Return empty array since targets table doesn't exist
      // TODO: Create targets table migration when needed
      return [];
    },
    enabled: !!userId,
  });
}

export function useCreateTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Omit<Target, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('targets')
        .insert([target])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['targets', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['target-achievements', data.user_id] });
    },
  });
}

export function useUpdateTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Target> }) => {
      const { data, error } = await supabase
        .from('targets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['targets', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['target-achievements', data.user_id] });
    },
  });
}

export function useDeleteTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('targets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['target-achievements'] });
    },
  });
}

// Helper function to calculate target periods
export function calculateTargetPeriod(targetType: 'daily' | 'weekly' | 'monthly' | 'yearly', date: Date = new Date()) {
  const now = new Date(date);
  let periodStart: Date;
  let periodEnd: Date;

  switch (targetType) {
    case 'daily': {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    }
    case 'weekly': {
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
      periodEnd = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000);
      break;
    }
    case 'monthly': {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    }
    case 'yearly': {
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    }
  }

  return { periodStart, periodEnd };
}

// Helper function to get default visit targets only
export function getDefaultVisitTargets(userId: string, targetType: 'daily' | 'weekly' | 'monthly' | 'yearly', systemSettings?: any[]) {
  const { periodStart, periodEnd } = calculateTargetPeriod(targetType);
  
  // Get system default for daily target
  const systemDefault = systemSettings?.find(s => s.setting_key === 'default_daily_visit_target')?.setting_value;
  const dailyTarget = systemDefault ? parseInt(systemDefault) : 15;
  
  return {
    user_id: userId,
    target_type: targetType,
    metric_type: 'visits' as const,
    target_value: targetType === 'daily' ? dailyTarget : targetType === 'weekly' ? dailyTarget * 5 : targetType === 'monthly' ? dailyTarget * 20 : dailyTarget * 240,
    achieved_value: 0,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
  };
} 