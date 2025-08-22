import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface OfflineData {
  id: string;
  type: 'lead' | 'visit' | 'followup';
  data: any;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
}

interface UseOfflineStorageReturn {
  isOnline: boolean;
  pendingItems: OfflineData[];
  saveOfflineData: (type: OfflineData['type'], action: OfflineData['action'], data: any) => void;
  clearOfflineData: (id: string) => void;
  syncOfflineData: () => Promise<void>;
}

export function useOfflineStorage(): UseOfflineStorageReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingItems, setPendingItems] = useState<OfflineData[]>([]);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Connection restored. Syncing offline data...",
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "You're offline. Data will be saved locally and synced when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending items from localStorage
    const savedItems = localStorage.getItem('offlineData');
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        setPendingItems(parsed);
      } catch (error) {
        console.error('Error loading offline data:', error);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Save pending items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('offlineData', JSON.stringify(pendingItems));
  }, [pendingItems]);

  const saveOfflineData = (type: OfflineData['type'], action: OfflineData['action'], data: any) => {
    const offlineItem: OfflineData = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      action
    };

    setPendingItems(prev => [...prev, offlineItem]);

    toast({
      title: "Saved Offline",
      description: `${type} data saved locally and will be synced when online.`,
    });
  };

  const clearOfflineData = (id: string) => {
    setPendingItems(prev => prev.filter(item => item.id !== id));
  };

  const syncOfflineData = async () => {
    if (!isOnline || pendingItems.length === 0) return;

    const itemsToSync = [...pendingItems];
    let successCount = 0;
    let errorCount = 0;

    for (const item of itemsToSync) {
      try {
        // Here you would implement the actual sync logic
        // For now, we'll simulate the sync
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
        
        clearOfflineData(item.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync ${item.type}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${successCount} items${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
      });
    }

    if (errorCount > 0) {
      toast({
        title: "Sync Errors",
        description: `${errorCount} items failed to sync and remain offline.`,
        variant: "destructive",
      });
    }
  };

  return {
    isOnline,
    pendingItems,
    saveOfflineData,
    clearOfflineData,
    syncOfflineData
  };
}
