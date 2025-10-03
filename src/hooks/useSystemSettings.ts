import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type SystemSetting = Tables<'system_settings'>;
export type SystemSettingInsert = TablesInsert<'system_settings'>;
export type SystemSettingUpdate = TablesUpdate<'system_settings'>;

// Default options if not found in database - will be overridden by database values
const DEFAULT_STATUS_OPTIONS: string[] = [];

const DEFAULT_WEEKLY_SPEND_OPTIONS = [
  "Less than £1000",
  "£1000 - £3000", 
  "£5000 - £9999",
  "£10,000+"
];

const DEFAULT_STORE_TYPE_OPTIONS = [
  "Vape Shop",
  "Convenience Store",
  "Supermarket",
  "Tobacco Shop",
  "Gas Station",
  "Pharmacy",
  "Other"
];

const DEFAULT_OWNS_SHOP_OR_WEBSITE_OPTIONS = [
  "No",
  "Yes",
  "NA"
];

const DEFAULT_NUMBER_OF_STORES_OPTIONS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10+"
];

const DEFAULT_VISIT_DISTANCE_VALIDATION = "25"; // meters

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key', { ascending: true });
      
      if (error) {
        console.error('Error fetching system settings:', error);
        throw error;
      }
      
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
  });
};

export const useLeadStatusOptions = () => {
  const { data: settings, isLoading, error } = useSystemSettings();
  
  const statusSetting = settings?.find(s => s.setting_key === 'lead_status_options');
  
  let statusOptions = DEFAULT_STATUS_OPTIONS;
  
  if (statusSetting) {
    try {
      statusOptions = JSON.parse(statusSetting.setting_value);
    } catch (error) {
      console.error('Error parsing lead status options:', error);
      statusOptions = DEFAULT_STATUS_OPTIONS;
    }
  }
  
  return {
    data: statusOptions,
    isLoading,
    error
  };
};

export const useWeeklySpendOptions = () => {
  const { data: settings, isLoading, error } = useSystemSettings();
  
  const weeklySpendSetting = settings?.find(s => s.setting_key === 'weekly_spend_options');
  
  let weeklySpendOptions = DEFAULT_WEEKLY_SPEND_OPTIONS;
  
  if (weeklySpendSetting) {
    try {
      weeklySpendOptions = JSON.parse(weeklySpendSetting.setting_value);
    } catch (error) {
      console.error('Error parsing weekly spend options:', error);
      weeklySpendOptions = DEFAULT_WEEKLY_SPEND_OPTIONS;
    }
  }
  
  return {
    data: weeklySpendOptions,
    isLoading,
    error
  };
};

// Legacy hook for backward compatibility
export const useBuyingPowerOptions = useWeeklySpendOptions;

export const useStoreTypeOptions = () => {
  const { data: settings, isLoading, error } = useSystemSettings();
  
  const storeTypeSetting = settings?.find(s => s.setting_key === 'store_type_options');
  
  let storeTypeOptions = DEFAULT_STORE_TYPE_OPTIONS;
  
  if (storeTypeSetting) {
    try {
      storeTypeOptions = JSON.parse(storeTypeSetting.setting_value);
    } catch (error) {
      console.error('Error parsing store type options:', error);
      storeTypeOptions = DEFAULT_STORE_TYPE_OPTIONS;
    }
  }
  
  return {
    data: storeTypeOptions,
    isLoading,
    error
  };
};

export const useOwnsShopOrWebsiteOptions = () => {
  const { data: settings, isLoading, error } = useSystemSettings();
  
  const ownsShopSetting = settings?.find(s => s.setting_key === 'owns_shop_or_website_options');
  
  let ownsShopOptions = DEFAULT_OWNS_SHOP_OR_WEBSITE_OPTIONS;
  
  if (ownsShopSetting) {
    try {
      ownsShopOptions = JSON.parse(ownsShopSetting.setting_value);
    } catch (error) {
      console.error('Error parsing owns shop or website options:', error);
      ownsShopOptions = DEFAULT_OWNS_SHOP_OR_WEBSITE_OPTIONS;
    }
  }
  
  return {
    data: ownsShopOptions,
    isLoading,
    error
  };
};

export const useNumberOfStoresOptions = () => {
  const { data: settings, isLoading, error } = useSystemSettings();
  
  const numberOfStoresSetting = settings?.find(s => s.setting_key === 'number_of_stores_options');
  
  let numberOfStoresOptions = DEFAULT_NUMBER_OF_STORES_OPTIONS;
  
  if (numberOfStoresSetting) {
    try {
      numberOfStoresOptions = JSON.parse(numberOfStoresSetting.setting_value);
    } catch (error) {
      console.error('Error parsing number of stores options:', error);
      numberOfStoresOptions = DEFAULT_NUMBER_OF_STORES_OPTIONS;
    }
  }
  
  return {
    data: numberOfStoresOptions,
    isLoading,
    error
  };
};

export const useVisitDistanceValidation = () => {
  const { data: settings, isLoading, error } = useSystemSettings();
  
  const distanceSetting = settings?.find(s => s.setting_key === 'visit_distance_validation');
  
  let distanceValidation = DEFAULT_VISIT_DISTANCE_VALIDATION;
  
  if (distanceSetting) {
    distanceValidation = distanceSetting.setting_value || DEFAULT_VISIT_DISTANCE_VALIDATION;
  }
  
  return {
    data: parseInt(distanceValidation),
    isLoading,
    error
  };
};

export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      // Check if setting exists
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('setting_key', key)
        .maybeSingle();
      
      if (existing) {
        // Update existing setting
        const { data, error } = await supabase
          .from('system_settings')
          .update({ 
            setting_value: value,
            description: description || null,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', key)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating system setting:', error);
          throw error;
        }
        
        return data;
      } else {
        // Create new setting
        const { data, error } = await supabase
          .from('system_settings')
          .insert({
            setting_key: key,
            setting_value: value,
            description: description || null
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating system setting:', error);
          throw error;
        }
        
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
  });
};

export const useCreateSystemSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (setting: SystemSettingInsert) => {
      const { data, error } = await supabase
        .from('system_settings')
        .insert(setting)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating system setting:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
  });
};

export const useSystemThemeColors = () => {
  const { data: settings } = useSystemSettings();
  
  const primaryColor = settings?.find(s => s.setting_key === 'system_primary_color')?.setting_value || '#3b82f6';
  const secondaryColor = settings?.find(s => s.setting_key === 'system_secondary_color')?.setting_value || '#f1f5f9';
  const accentColor = settings?.find(s => s.setting_key === 'system_accent_color')?.setting_value || '#10b981';
  const activeColor = settings?.find(s => s.setting_key === 'system_active_color')?.setting_value || '#22c55e';
  const inactiveColor = settings?.find(s => s.setting_key === 'system_inactive_color')?.setting_value || '#ef4444';
  const systemTheme = settings?.find(s => s.setting_key === 'system_theme')?.setting_value || 'system';
  
  return {
    primaryColor,
    secondaryColor,
    accentColor,
    activeColor,
    inactiveColor,
    systemTheme,
  };
}; 