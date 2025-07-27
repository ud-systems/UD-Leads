
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { applyCustomColors } from '@/lib/utils';

export const useColorSystem = () => {
  const { user } = useAuth();
  const { data: preferences, isLoading, error } = useUserPreferences(user?.id);

  useEffect(() => {
    // Apply custom colors using the utility function
    applyCustomColors({
      primary: preferences?.primary_color || '#3b82f6',
      secondary: preferences?.secondary_color || '#f1f5f9',
      accent: preferences?.accent_color || '#10b981',
      active: preferences?.active_color || '#22c55e',
      inactive: preferences?.inactive_color || '#ef4444',
    });
  }, [preferences]);

  return preferences;
};
