import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type SystemSetting = Tables<'system_settings'>;
export type SystemSettingInsert = TablesInsert<'system_settings'>;
export type SystemSettingUpdate = TablesUpdate<'system_settings'>;

// Default options if not found in database
const DEFAULT_STATUS_OPTIONS = [
  "New Prospect",
  "In Discussion", 
  "Trial Order",
  "Converted",
  "Visited - Follow-Up Required",
  "Visited - No Interest"
];

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
  });
};

export const useLeadStatusOptions = () => {
  const { data: settings } = useSystemSettings();
  
  const statusSetting = settings?.find(s => s.setting_key === 'lead_status_options');
  
  if (statusSetting) {
    try {
      return JSON.parse(statusSetting.setting_value);
    } catch (error) {
      console.error('Error parsing lead status options:', error);
      return DEFAULT_STATUS_OPTIONS;
    }
  }
  
  return DEFAULT_STATUS_OPTIONS;
};

export const useWeeklySpendOptions = () => {
  const { data: settings } = useSystemSettings();
  
  const weeklySpendSetting = settings?.find(s => s.setting_key === 'weekly_spend_options');
  
  if (weeklySpendSetting) {
    try {
      return JSON.parse(weeklySpendSetting.setting_value);
    } catch (error) {
      console.error('Error parsing weekly spend options:', error);
      return DEFAULT_WEEKLY_SPEND_OPTIONS;
    }
  }
  
  return DEFAULT_WEEKLY_SPEND_OPTIONS;
};

// Legacy hook for backward compatibility
export const useBuyingPowerOptions = useWeeklySpendOptions;

export const useStoreTypeOptions = () => {
  const { data: settings } = useSystemSettings();
  
  const storeTypeSetting = settings?.find(s => s.setting_key === 'store_type_options');
  
  if (storeTypeSetting) {
    try {
      return JSON.parse(storeTypeSetting.setting_value);
    } catch (error) {
      console.error('Error parsing store type options:', error);
      return DEFAULT_STORE_TYPE_OPTIONS;
    }
  }
  
  return DEFAULT_STORE_TYPE_OPTIONS;
};

export const useOwnsShopOrWebsiteOptions = () => {
  const { data: settings } = useSystemSettings();
  
  const ownsShopSetting = settings?.find(s => s.setting_key === 'owns_shop_or_website_options');
  
  if (ownsShopSetting) {
    try {
      return JSON.parse(ownsShopSetting.setting_value);
    } catch (error) {
      console.error('Error parsing owns shop or website options:', error);
      return DEFAULT_OWNS_SHOP_OR_WEBSITE_OPTIONS;
    }
  }
  
  return DEFAULT_OWNS_SHOP_OR_WEBSITE_OPTIONS;
};

export const useNumberOfStoresOptions = () => {
  const { data: settings } = useSystemSettings();
  
  const numberOfStoresSetting = settings?.find(s => s.setting_key === 'number_of_stores_options');
  
  if (numberOfStoresSetting) {
    try {
      return JSON.parse(numberOfStoresSetting.setting_value);
    } catch (error) {
      console.error('Error parsing number of stores options:', error);
      return DEFAULT_NUMBER_OF_STORES_OPTIONS;
    }
  }
  
  return DEFAULT_NUMBER_OF_STORES_OPTIONS;
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