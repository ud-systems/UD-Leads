import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLeads } from '@/hooks/useLeads';
import { useVisits } from '@/hooks/useVisits';
import { useUsers } from '@/hooks/useUsers';
import { useTerritories } from '@/hooks/useTerritories';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useStatusColors } from '@/hooks/useStatusColors';
import { useConversionRules } from '@/hooks/useConversionRules';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useSuppliers } from '@/hooks/useSuppliers';

export interface BackupData {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental';
  size: number;
  tables: {
    leads?: any[];
    visits?: any[];
    users?: any[];
    territories?: any[];
    system_settings?: any[];
    status_colors?: any[];
    conversion_rules?: any[];
    company_logos?: any[];
    suppliers?: any[];
  };
  metadata: {
    totalRecords: number;
    lastBackupId?: string;
    checksum: string;
    version: string;
  };
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  storageLocation: 'local' | 'download' | 'both';
  includePhotos: boolean;
  compression: boolean;
  lastBackupTime?: string;
  nextBackupTime?: string;
}

const BACKUP_STORAGE_KEY = 'ud-leads-backups';
const BACKUP_SETTINGS_KEY = 'ud-leads-backup-settings';
const DEFAULT_SETTINGS: BackupSettings = {
  enabled: false,
  frequency: 'daily',
  retentionDays: 3, // Reduced to 3 days to prevent storage issues
  storageLocation: 'download', // Default to download to avoid localStorage issues
  includePhotos: false, // Disable photos by default to reduce size
  compression: true,
};

export function useBackupManager() {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [settings, setSettings] = useState<BackupSettings>(DEFAULT_SETTINGS);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [nextBackupTime, setNextBackupTime] = useState<string | null>(null);
  const [storageUsed, setStorageUsed] = useState(0);
  
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Data hooks
  const { data: leads } = useLeads();
  const { data: visits } = useVisits();
  const { data: users } = useUsers();
  const { data: territories } = useTerritories();
  const { data: systemSettings } = useSystemSettings();
  const { data: statusColors } = useStatusColors();
  const { data: conversionRules } = useConversionRules();
  const { data: companyLogo } = useCompanyLogo();
  const { data: suppliers } = useSuppliers();

  // Load backups and settings on mount
  useEffect(() => {
    loadBackups();
    loadSettings();
  }, []);

  // Setup automatic backup scheduling
  useEffect(() => {
    if (settings.enabled) {
      setupAutomaticBackup();
    } else {
      clearAutomaticBackup();
    }
    
    return () => clearAutomaticBackup();
  }, [settings.enabled, settings.frequency]);

  // Aggressive compression using data optimization and selective storage
  const compressBackupData = useCallback((backups: BackupData[]): string => {
    // Create a much more compact representation
    const compressed = backups.map(backup => {
      // Only keep the most recent 3 backups with full data, others get minimal data
      const isRecent = backups.indexOf(backup) < 3;
      
      if (isRecent) {
        // Full data for recent backups
        return {
          id: backup.id,
          timestamp: backup.timestamp,
          type: backup.type,
          size: backup.size,
          metadata: backup.metadata,
          // Only store essential table data, remove empty arrays and large fields
          tables: Object.fromEntries(
            Object.entries(backup.tables)
              .filter(([_, data]) => Array.isArray(data) && data.length > 0)
              .map(([key, data]) => [
                key, 
                // Remove large fields that aren't essential for restore
                Array.isArray(data) ? data.map(item => {
                  const { id, created_at, updated_at, ...essential } = item;
                  return essential;
                }) : data
              ])
          )
        };
      } else {
        // Minimal data for older backups (just metadata)
        return {
          id: backup.id,
          timestamp: backup.timestamp,
          type: backup.type,
          size: backup.size,
          metadata: backup.metadata,
          tables: {} // No table data for old backups
        };
      }
    });
    
    return JSON.stringify(compressed);
  }, []);

  const decompressBackupData = useCallback((compressedData: string): BackupData[] => {
    try {
      const parsed = JSON.parse(compressedData);
      // If it's already in the new format, return as is
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
        return parsed as BackupData[];
      }
      // If it's in the old format, return as is (backward compatibility)
      return parsed as BackupData[];
    } catch (error) {
      console.error('Error decompressing backup data:', error);
      return [];
    }
  }, []);

  const loadBackups = useCallback(() => {
    try {
      const stored = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (stored) {
        const parsedBackups = decompressBackupData(stored);
        setBackups(parsedBackups);
        calculateStorageUsed(parsedBackups);
        
        // Set last backup time
        if (parsedBackups.length > 0) {
          const latest = parsedBackups.sort((a: BackupData, b: BackupData) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          setLastBackupTime(latest.timestamp);
        }
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      toast({
        title: "Error",
        description: "Failed to load backup data",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem(BACKUP_SETTINGS_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading backup settings:', error);
    }
  }, []);

  const saveBackups = useCallback((newBackups: BackupData[]) => {
    try {
      // Compress the backup data before storing
      const compressedData = compressBackupData(newBackups);
      console.log('Backup data size:', compressedData.length, 'bytes');
      localStorage.setItem(BACKUP_STORAGE_KEY, compressedData);
      setBackups(newBackups);
      calculateStorageUsed(newBackups);
      console.log('Backup saved successfully');
    } catch (error) {
      console.error('Error saving backups:', error);
      
      // If quota exceeded, try multiple fallback strategies
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Strategy 1: Keep only the most recent 2 backups
        let reducedBackups = newBackups.slice(0, 2);
        try {
          const compressedData = compressBackupData(reducedBackups);
          localStorage.setItem(BACKUP_STORAGE_KEY, compressedData);
          setBackups(reducedBackups);
          calculateStorageUsed(reducedBackups);
          
          toast({
            title: "Storage Limit Reached",
            description: `Kept only the 2 most recent backups to free up space. Consider using 'Download' storage option.`,
            variant: "destructive",
          });
          return;
        } catch (retryError) {
          // Strategy 2: Keep only the most recent backup
          reducedBackups = newBackups.slice(0, 1);
          try {
            const compressedData = compressBackupData(reducedBackups);
            localStorage.setItem(BACKUP_STORAGE_KEY, compressedData);
            setBackups(reducedBackups);
            calculateStorageUsed(reducedBackups);
            
            toast({
              title: "Storage Critical",
              description: `Kept only the most recent backup. Please use 'Download' storage option for long-term backups.`,
              variant: "destructive",
            });
            return;
          } catch (finalError) {
            // Strategy 3: Clear all backups and start fresh
            localStorage.removeItem(BACKUP_STORAGE_KEY);
            setBackups([]);
            setStorageUsed(0);
            
            toast({
              title: "Storage Full - Starting Fresh",
              description: "Cleared all backups due to storage limits. Please use 'Download' storage option.",
              variant: "destructive",
            });
            return;
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to save backup data",
          variant: "destructive",
        });
      }
    }
  }, [toast, compressBackupData]);

  const saveSettings = useCallback((newSettings: BackupSettings) => {
    try {
      localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving backup settings:', error);
      toast({
        title: "Error",
        description: "Failed to save backup settings",
        variant: "destructive",
      });
    }
  }, [toast]);

  const calculateStorageUsed = useCallback((backupList: BackupData[]) => {
    const totalSize = backupList.reduce((sum, backup) => sum + backup.size, 0);
    setStorageUsed(totalSize);
  }, []);

  const generateChecksum = useCallback((data: any): string => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }, []);

  const collectAllData = useCallback(async (): Promise<any> => {
    const data = {
      leads: leads || [],
      visits: visits || [],
      users: users || [],
      territories: territories || [],
      system_settings: systemSettings || [],
      status_colors: statusColors || [],
      conversion_rules: conversionRules || [],
      company_logos: companyLogo ? [companyLogo] : [],
      suppliers: suppliers || [],
    };

    // Calculate total records
    const totalRecords = Object.values(data).reduce((sum, table) => sum + table.length, 0);

    return {
      ...data,
      metadata: {
        totalRecords,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      }
    };
  }, [leads, visits, users, territories, systemSettings, statusColors, conversionRules, companyLogo, suppliers]);

  const createBackup = useCallback(async (type: 'full' | 'incremental' = 'full'): Promise<BackupData | null> => {
    if (isBackingUp) {
      toast({
        title: "Backup in Progress",
        description: "Please wait for the current backup to complete",
        variant: "destructive",
      });
      return null;
    }

    setIsBackingUp(true);
    
    try {
      const allData = await collectAllData();
      const checksum = generateChecksum(allData);
      
      // For incremental backups, check if data has changed
      if (type === 'incremental' && backups.length > 0) {
        const lastBackup = backups[0]; // Assuming backups are sorted by timestamp desc
        if (lastBackup.metadata.checksum === checksum) {
          toast({
            title: "No Changes",
            description: "No data changes detected since last backup",
          });
          setIsBackingUp(false);
          return null;
        }
      }

      const backup: BackupData = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type,
        size: JSON.stringify(allData).length,
        tables: allData,
        metadata: {
          totalRecords: allData.metadata.totalRecords,
          lastBackupId: type === 'incremental' && backups.length > 0 ? backups[0].id : undefined,
          checksum,
          version: '1.0.0',
        }
      };

      // Add to backups list
      const newBackups = [backup, ...backups];
      
      // Apply retention policy
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - settings.retentionDays);
      let filteredBackups = newBackups.filter(backup => 
        new Date(backup.timestamp) > retentionDate
      );

      // Apply storage quota management
      filteredBackups = manageStorageQuota(filteredBackups);

      saveBackups(filteredBackups);
      setLastBackupTime(backup.timestamp);

      // Handle storage location
      if (settings.storageLocation === 'download' || settings.storageLocation === 'both') {
        downloadBackup(backup);
      }

      toast({
        title: "Backup Created",
        description: `${type === 'full' ? 'Full' : 'Incremental'} backup created successfully`,
      });

      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsBackingUp(false);
    }
  }, [isBackingUp, collectAllData, generateChecksum, backups, settings.retentionDays, settings.storageLocation, saveBackups, toast]);

  const downloadBackup = useCallback((backup: BackupData) => {
    try {
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ud-leads-backup-${backup.timestamp.split('T')[0]}-${backup.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download backup file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const restoreBackup = useCallback(async (backupId: string): Promise<boolean> => {
    if (isRestoring) {
      toast({
        title: "Restore in Progress",
        description: "Please wait for the current restore to complete",
        variant: "destructive",
      });
      return false;
    }

    setIsRestoring(true);
    
    try {
      const backup = backups.find(b => b.id === backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Confirm restore action
      const confirmed = window.confirm(
        `Are you sure you want to restore from backup created on ${new Date(backup.timestamp).toLocaleString()}?\n\nThis will overwrite all current data.`
      );
      
      if (!confirmed) {
        setIsRestoring(false);
        return false;
      }

      // Restore each table
      const tables = Object.keys(backup.tables).filter(key => key !== 'metadata');
      
      for (const tableName of tables) {
        const tableData = backup.tables[tableName as keyof typeof backup.tables];
        if (tableData && Array.isArray(tableData)) {
          // Clear existing data and insert backup data
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
          
          if (deleteError) {
            console.warn(`Error clearing table ${tableName}:`, deleteError);
          }

          if (tableData.length > 0) {
            const { error: insertError } = await supabase
              .from(tableName)
              .insert(tableData);
            
            if (insertError) {
              console.error(`Error restoring table ${tableName}:`, insertError);
              throw new Error(`Failed to restore table ${tableName}`);
            }
          }
        }
      }

      toast({
        title: "Restore Successful",
        description: "Data has been restored from backup",
      });

      // Refresh the page to reload all data
      window.location.reload();
      
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Failed to restore backup",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, backups, toast]);

  const deleteBackup = useCallback((backupId: string) => {
    try {
      const newBackups = backups.filter(backup => backup.id !== backupId);
      saveBackups(newBackups);
      
      toast({
        title: "Backup Deleted",
        description: "Backup has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete backup",
        variant: "destructive",
      });
    }
  }, [backups, saveBackups, toast]);

  const clearAllBackups = useCallback(() => {
    try {
      localStorage.removeItem(BACKUP_STORAGE_KEY);
      setBackups([]);
      setStorageUsed(0);
      setLastBackupTime(null);
      
      toast({
        title: "All Backups Cleared",
        description: "All backup data has been removed. Storage space freed up.",
      });
    } catch (error) {
      console.error('Error clearing backups:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear backup data",
        variant: "destructive",
      });
    }
  }, [toast]);

  const forceClearStorage = useCallback(() => {
    try {
      // Clear all backup-related localStorage data
      localStorage.removeItem(BACKUP_STORAGE_KEY);
      localStorage.removeItem(BACKUP_SETTINGS_KEY);
      
      // Reset all state
      setBackups([]);
      setStorageUsed(0);
      setLastBackupTime(null);
      setSettings(DEFAULT_SETTINGS);
      
      toast({
        title: "Storage Reset",
        description: "All backup data and settings have been cleared. Starting fresh.",
      });
    } catch (error) {
      console.error('Error clearing storage:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to clear storage data",
        variant: "destructive",
      });
    }
  }, [toast]);

  const setupAutomaticBackup = useCallback(() => {
    clearAutomaticBackup();
    
    const getNextBackupTime = () => {
      const now = new Date();
      const next = new Date(now);
      
      switch (settings.frequency) {
        case 'hourly':
          next.setHours(next.getHours() + 1);
          break;
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
      }
      
      return next;
    };

    const scheduleNextBackup = () => {
      const nextTime = getNextBackupTime();
      setNextBackupTime(nextTime.toISOString());
      
      const timeUntilNext = nextTime.getTime() - Date.now();
      
      intervalRef.current = setTimeout(() => {
        createBackup('incremental');
        scheduleNextBackup();
      }, timeUntilNext);
    };

    scheduleNextBackup();
  }, [settings.frequency, createBackup]);

  const clearAutomaticBackup = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    setNextBackupTime(null);
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getStorageInfo = useCallback(() => {
    const maxStorage = 50 * 1024 * 1024; // 50MB limit for localStorage
    const usedPercentage = (storageUsed / maxStorage) * 100;
    
    // Calculate actual localStorage usage
    let actualUsed = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          actualUsed += localStorage[key].length;
        }
      }
    } catch (error) {
      console.warn('Could not calculate localStorage usage:', error);
    }
    
    return {
      used: storageUsed,
      actualUsed: actualUsed,
      max: maxStorage,
      usedFormatted: formatFileSize(storageUsed),
      actualUsedFormatted: formatFileSize(actualUsed),
      maxFormatted: formatFileSize(maxStorage),
      usedPercentage: Math.round(usedPercentage),
      actualUsedPercentage: Math.round((actualUsed / maxStorage) * 100),
      isNearLimit: usedPercentage > 80,
      isAtLimit: usedPercentage > 95,
    };
  }, [storageUsed, formatFileSize]);

  const manageStorageQuota = useCallback((newBackups: BackupData[]) => {
    const storageInfo = getStorageInfo();
    
    // Always limit to a reasonable number of backups to prevent storage issues
    let maxBackups = 10; // Default maximum
    
    // If we're near the limit, be more aggressive about cleanup
    if (storageInfo.isNearLimit) {
      maxBackups = 5; // Keep only 5 most recent backups
    }
    
    // If we're at the limit, be very aggressive
    if (storageInfo.isAtLimit) {
      maxBackups = 3; // Keep only 3 most recent backups
    }
    
    // Always limit the number of backups
    return newBackups.slice(0, maxBackups);
  }, [getStorageInfo]);

  return {
    // State
    backups,
    settings,
    isBackingUp,
    isRestoring,
    lastBackupTime,
    nextBackupTime,
    storageUsed,
    
    // Actions
    createBackup,
    restoreBackup,
    deleteBackup,
    clearAllBackups,
    forceClearStorage,
    downloadBackup,
    saveSettings,
    
    // Utilities
    formatFileSize,
    getStorageInfo,
    loadBackups,
  };
}
