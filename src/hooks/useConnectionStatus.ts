import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    try {
      setStatus('connecting');
      
      // Simple health check query
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        console.warn('Connection check failed:', error);
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
    // Initial check
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    // Check on window focus (user returns to tab)
    const handleFocus = () => {
      checkConnection();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
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
