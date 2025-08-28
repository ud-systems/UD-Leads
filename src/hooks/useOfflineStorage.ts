import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface OfflineLead {
  id: string;
  data: Record<string, unknown>;
  photos: OfflinePhoto[];
  timestamp: number;
  status: 'draft' | 'pending_sync';
  form_start_time: number;
  form_submit_time?: number;
  form_duration_ms?: number;
}

interface OfflinePhoto {
  id: string;
  data: string; // base64
  filename: string;
  timestamp: number;
}

interface SyncMetadata {
  lastSyncTimestamp: number;
  pendingCount: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  retryCount: number;
  lastError?: string;
}

const STORAGE_KEYS = {
  DRAFTS: 'offline_drafts',
  PENDING: 'offline_pending_sync',
  PHOTOS: 'offline_photos',
  METADATA: 'offline_sync_metadata'
};

const CLEANUP_INTERVALS = {
  DRAFTS: 24 * 60 * 60 * 1000, // 24 hours
  PHOTOS: 24 * 60 * 60 * 1000, // 24 hours
  RETRY_DELAY: 5000, // 5 seconds
  MAX_RETRIES: 3
};

export function useOfflineStorage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata>({
    lastSyncTimestamp: 0,
    pendingCount: 0,
    syncStatus: 'idle',
    retryCount: 0
  });

  // Get user-specific storage key
  const getUserStorageKey = useCallback((key: string) => `${key}_${user?.id}`, [user?.id]);

  // Get drafts
  const getDrafts = useCallback((): OfflineLead[] => {
    if (!user) return [];
    
    const drafts = localStorage.getItem(getUserStorageKey(STORAGE_KEYS.DRAFTS));
    return drafts ? JSON.parse(drafts) : [];
  }, [user, getUserStorageKey]);

  // Get pending sync
  const getPendingSync = useCallback((): OfflineLead[] => {
    if (!user) return [];
    
    const pending = localStorage.getItem(getUserStorageKey(STORAGE_KEYS.PENDING));
    return pending ? JSON.parse(pending) : [];
  }, [user, getUserStorageKey]);

  // Get pending count
  const getPendingCount = useCallback(() => {
    return getPendingSync().length;
  }, [getPendingSync]);

  // Get offline photos
  const getOfflinePhotos = useCallback((): OfflinePhoto[] => {
    if (!user) return [];
    
    const photos = localStorage.getItem(getUserStorageKey(STORAGE_KEYS.PHOTOS));
    return photos ? JSON.parse(photos) : [];
  }, [user, getUserStorageKey]);

  // Load sync metadata
  const loadSyncMetadata = useCallback(() => {
    if (!user) return;
    
    const metadata = localStorage.getItem(getUserStorageKey(STORAGE_KEYS.METADATA));
    if (metadata) {
      setSyncMetadata(JSON.parse(metadata));
    }
  }, [user, getUserStorageKey]);

  // Save sync metadata
  const saveSyncMetadata = useCallback((metadata: Partial<SyncMetadata>) => {
    if (!user) return;
    
    const updatedMetadata = { ...syncMetadata, ...metadata };
    setSyncMetadata(updatedMetadata);
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.METADATA), JSON.stringify(updatedMetadata));
  }, [user, syncMetadata, getUserStorageKey]);

  // Save offline photo
  const saveOfflinePhoto = useCallback((photo: OfflinePhoto) => {
    if (!user) return;

    const photos = getOfflinePhotos();
    photos.push(photo);
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.PHOTOS), JSON.stringify(photos));
  }, [user, getOfflinePhotos, getUserStorageKey]);

  // Upload photos to Supabase storage
  const uploadPhotos = useCallback(async (photos: OfflinePhoto[]): Promise<string[]> => {
    const photoUrls: string[] = [];

    for (const photo of photos) {
      try {
        // Convert base64 to blob
        const response = await fetch(photo.data);
        const blob = await response.blob();

        // Upload to Supabase storage
        const fileName = `offline_photos/${user?.id}/${photo.id}_${photo.filename}`;
        const { data, error } = await supabase.storage
          .from('lead-photos')
          .upload(fileName, blob);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('lead-photos')
          .getPublicUrl(fileName);

        photoUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error('Photo upload failed:', error);
        throw error;
      }
    }

    return photoUrls;
  }, [user?.id]);

  // Sync individual lead
  const syncLead = useCallback(async (lead: OfflineLead) => {
    // Upload photos first
    const photoUrls = await uploadPhotos(lead.photos);
    
    // Create lead with photo URLs
    const leadData = {
      ...lead.data,
      photos: photoUrls,
      form_start_time: new Date(lead.form_start_time).toISOString(),
      form_submit_time: lead.form_submit_time ? new Date(lead.form_submit_time).toISOString() : null,
      form_duration_ms: lead.form_duration_ms
    };

    const { error } = await supabase
      .from('leads')
      .insert([leadData]);

    if (error) throw error;

    // Remove photos from local storage
    const photos = getOfflinePhotos();
    const remainingPhotos = photos.filter(photo => 
      !lead.photos.some(leadPhoto => leadPhoto.id === photo.id)
    );
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.PHOTOS), JSON.stringify(remainingPhotos));
  }, [getOfflinePhotos, getUserStorageKey, uploadPhotos]);

  // Sync pending leads
  const triggerSync = useCallback(async () => {
    if (!user || !isOnline || syncMetadata.syncStatus === 'syncing') return;

    const pending = getPendingSync();
    if (pending.length === 0) return;

    saveSyncMetadata({ syncStatus: 'syncing' });

    try {
      for (const lead of pending) {
        await syncLead(lead);
      }

      // Clear pending after successful sync
      localStorage.setItem(getUserStorageKey(STORAGE_KEYS.PENDING), JSON.stringify([]));
      saveSyncMetadata({ 
        syncStatus: 'idle', 
        pendingCount: 0, 
        lastSyncTimestamp: Date.now(),
        retryCount: 0,
        lastError: undefined
      });

      toast({
        title: "Sync Complete",
        description: `Successfully synced ${pending.length} lead(s) to database.`,
        duration: 5000
      });

    } catch (error) {
      console.error('Sync failed:', error);
      
      const newRetryCount = syncMetadata.retryCount + 1;
      
      if (newRetryCount >= CLEANUP_INTERVALS.MAX_RETRIES) {
        saveSyncMetadata({ 
          syncStatus: 'error', 
          retryCount: newRetryCount,
          lastError: error instanceof Error ? error.message : 'Unknown error'
        });

        toast({
          title: "Sync Failed",
          description: "Manual retry required. Check your connection and try again.",
          variant: "destructive",
          duration: 10000
        });
      } else {
        saveSyncMetadata({ 
          syncStatus: 'error', 
          retryCount: newRetryCount,
          lastError: error instanceof Error ? error.message : 'Unknown error'
        });

        // Auto retry after delay
        setTimeout(() => {
          if (isOnline) {
            triggerSync();
          }
        }, CLEANUP_INTERVALS.RETRY_DELAY);
      }
    }
  }, [user, isOnline, syncMetadata, getPendingSync, saveSyncMetadata, syncLead, toast, getUserStorageKey]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (getPendingCount() > 0) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [getPendingCount, triggerSync]);

  // Cleanup expired data
  const cleanupExpiredData = useCallback(() => {
    if (!user) return;

    const now = Date.now();

    // Cleanup expired drafts
    const drafts = getDrafts();
    const validDrafts = drafts.filter(draft => 
      now - draft.timestamp < CLEANUP_INTERVALS.DRAFTS
    );
    
    if (validDrafts.length !== drafts.length) {
      localStorage.setItem(getUserStorageKey(STORAGE_KEYS.DRAFTS), JSON.stringify(validDrafts));
    }

    // Cleanup expired photos
    const photos = getOfflinePhotos();
    const validPhotos = photos.filter(photo => 
      now - photo.timestamp < CLEANUP_INTERVALS.PHOTOS
    );
    
    if (validPhotos.length !== photos.length) {
      localStorage.setItem(getUserStorageKey(STORAGE_KEYS.PHOTOS), JSON.stringify(validPhotos));
    }
  }, [user, getDrafts, getOfflinePhotos, getUserStorageKey]);

  // Initialize and load metadata
  useEffect(() => {
    if (user) {
      loadSyncMetadata();
      cleanupExpiredData();
    }
  }, [user, loadSyncMetadata, cleanupExpiredData]);

  // Listen for service worker messages (only if service worker is available)
  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'TRIGGER_SYNC') {
        if (isOnline && getPendingCount() > 0) {
          triggerSync();
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [isOnline, getPendingCount, triggerSync]);

  // Save draft lead
  const saveDraft = useCallback((leadData: Record<string, unknown>, photos: OfflinePhoto[] = []) => {
    if (!user) return;

    const draft: OfflineLead = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: leadData,
      photos,
      timestamp: Date.now(),
      status: 'draft',
      form_start_time: leadData.form_start_time || Date.now()
    };

    const drafts = getDrafts();
    drafts.push(draft);
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.DRAFTS), JSON.stringify(drafts));
    
    toast({
      title: "Draft Saved",
      description: "Your progress has been saved locally.",
      duration: 3000
    });
  }, [user, getDrafts, getUserStorageKey, toast]);

  // Complete lead (move from draft to pending sync)
  const completeLead = useCallback((draftId: string, formData: Record<string, unknown>, photos: OfflinePhoto[] = []) => {
    if (!user) return;

    const completedLead: OfflineLead = {
      id: draftId,
      data: formData,
      photos,
      timestamp: Date.now(),
      status: 'pending_sync',
      form_start_time: formData.form_start_time ? new Date(formData.form_start_time).getTime() : Date.now(),
      form_submit_time: Date.now(),
      form_duration_ms: formData.form_start_time ? 
        Date.now() - new Date(formData.form_start_time).getTime() : 
        null
    };

    // Add to pending sync
    const pending = getPendingSync();
    pending.push(completedLead);
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.PENDING), JSON.stringify(pending));

    // Save photos to offline storage
    photos.forEach(photo => {
      saveOfflinePhoto(photo);
    });

    // Update metadata
    saveSyncMetadata({ pendingCount: pending.length });

    toast({
      title: "Lead Completed",
      description: "Lead saved offline. Will sync when internet is available.",
      duration: 5000
    });

    // Trigger sync if online
    if (isOnline) {
      triggerSync();
    }
  }, [user, isOnline, getPendingSync, getUserStorageKey, saveOfflinePhoto, saveSyncMetadata, toast, triggerSync]);

  // Export offline data as CSV
  const exportOfflineData = useCallback(() => {
    if (!user) return;

    const drafts = getDrafts();
    const pending = getPendingSync();
    const allData = [...drafts, ...pending];

    if (allData.length === 0) {
      toast({
        title: "No Data",
        description: "No offline data to export.",
        duration: 3000
      });
      return;
    }

    // Convert to CSV format
    const csvData = allData.map(lead => ({
      ID: lead.id,
      Status: lead.status,
      Company: lead.data.company_name || '',
      Contact: lead.data.contact_person || '',
      Email: lead.data.email || '',
      Phone: lead.data.phone_number || '',
      Created: new Date(lead.timestamp).toLocaleString(),
      'Form Duration (ms)': lead.form_duration_ms || ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline_leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${allData.length} lead(s) to CSV.`,
      duration: 3000
    });
  }, [user, getDrafts, getPendingSync, toast]);

  return {
    // State
    isOnline,
    syncMetadata,
    
    // Draft operations
    saveDraft,
    getDrafts,
    completeLead,
    
    // Sync operations
    getPendingSync,
    getPendingCount,
    triggerSync,
    
    // Photo operations
    saveOfflinePhoto,
    getOfflinePhotos,
    
    // Utility
    exportOfflineData,
    cleanupExpiredData
  };
}
