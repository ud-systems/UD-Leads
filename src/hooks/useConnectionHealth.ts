import { useState, useEffect, useCallback } from 'react';
import { runConnectionDiagnostics, type ConnectionDiagnostics } from '@/utils/connectionDiagnostics';

interface ConnectionHealth {
  healthy: boolean;
  latency?: number;
  error?: string;
  lastChecked: Date;
  supabaseReachable: boolean;
  authServiceReachable: boolean;
  databaseReachable: boolean;
}

export function useConnectionHealth(intervalMs: number = 300000) { // 5 minutes instead of 30 seconds
  const [health, setHealth] = useState<ConnectionHealth>({
    healthy: true,
    lastChecked: new Date(),
    supabaseReachable: false,
    authServiceReachable: false,
    databaseReachable: false,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const diagnostics = await runConnectionDiagnostics();
      const isHealthy = diagnostics.supabaseReachable && 
                       diagnostics.authServiceReachable && 
                       diagnostics.databaseReachable;
      
      setHealth({
        healthy: isHealthy,
        supabaseReachable: diagnostics.supabaseReachable,
        authServiceReachable: diagnostics.authServiceReachable,
        databaseReachable: diagnostics.databaseReachable,
        error: diagnostics.errors.length > 0 ? diagnostics.errors.join('; ') : undefined,
        lastChecked: new Date(),
      });
    } catch (error) {
      console.error('Connection health check failed:', error);
      setHealth({
        healthy: false,
        supabaseReachable: false,
        authServiceReachable: false,
        databaseReachable: false,
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

  // Check health when network comes back online (but not on focus to reduce noise)
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
