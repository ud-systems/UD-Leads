import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    if (!navigator.onLine) {
      setStatus('disconnected');
      return;
    }
    try {
      setStatus('connecting');
      // Valid health check: select one column, limit 1 (profiles may not have "count" column)
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('Connection check failed:', error.message);
        setStatus('error');
      } else {
        setStatus('connected');
        setLastChecked(new Date());
      }
    } catch (error) {
      console.warn('Connection check error:', error);
      setStatus('disconnected');
    }
  };

  useEffect(() => {
    if (!navigator.onLine) {
      setStatus('disconnected');
    } else {
      checkConnection();
    }
    // Check every 60s (was 30s) to reduce load and connection churn
    const interval = setInterval(() => {
      if (navigator.onLine) checkConnection();
      else setStatus('disconnected');
    }, 60000);
    const handleFocus = () => {
      if (navigator.onLine) checkConnection();
    };
    const handleOnline = () => checkConnection();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return {
    status,
    lastChecked,
    checkConnection,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
    hasError: status === 'error'
  };
};
