import { useState, useEffect, useCallback } from 'react';
import { checkConnectionHealth } from '@/integrations/supabase/client';

interface ConnectionHealth {
  healthy: boolean;
  latency?: number;
  error?: string;
  lastChecked: Date;
}

export function useConnectionHealth(intervalMs: number = 30000) {
  const [health, setHealth] = useState<ConnectionHealth>({
    healthy: true,
    lastChecked: new Date(),
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await checkConnectionHealth();
      setHealth({
        ...result,
        lastChecked: new Date(),
      });
    } catch (error) {
      console.error('Connection health check failed:', error);
      setHealth({
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      });
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  useEffect(() => {
    // Initial check
    checkHealth();

    // Set up interval for periodic checks
    const interval = setInterval(checkHealth, intervalMs);

    return () => clearInterval(interval);
  }, [checkHealth, intervalMs]);

  // Check health on window focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      checkHealth();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkHealth]);

  // Check health when network comes back online
  useEffect(() => {
    const handleOnline = () => {
      checkHealth();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [checkHealth]);

  return {
    ...health,
    isChecking,
    checkHealth,
  };
}
