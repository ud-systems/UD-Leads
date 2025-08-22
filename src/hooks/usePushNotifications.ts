import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../integrations/supabase/client';

type BrowserPushSubscription = PushSubscription;

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<BrowserPushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Check if push notifications are supported
  useEffect(() => {
    // Disable push notifications for now
    setIsSupported(false);
    setPermission('denied');
  }, []);

  // Convert base64 string to Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Push notifications disabled
    return false;
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    // Push notifications disabled
    return null;
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    // Push notifications disabled
    console.log('Push notifications are currently disabled');
    return false;
  }, []);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    // Push notifications disabled
    return false;
  }, []);

  // Initialize push notifications
  const initialize = useCallback(async () => {
    // Push notifications disabled
    console.log('Push notifications are currently disabled');
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    initialize
  };
}; 