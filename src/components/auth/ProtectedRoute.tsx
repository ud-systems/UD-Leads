
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConnectionHealth } from '@/hooks/useConnectionHealth';
import { Loader2, Wifi, WifiOff } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, connectionHealthy } = useAuth();
  const { healthy: connectionHealth, isChecking } = useConnectionHealth(60000); // Check every minute

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      {/* Connection Status Banner */}
      {!connectionHealth && !isChecking && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2">
          <div className="flex items-center justify-center space-x-2 text-red-700 dark:text-red-300">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              Connection issues detected. Some features may not work properly.
            </span>
          </div>
        </div>
      )}
      
      {/* Connection Recovery Banner */}
      {connectionHealth && !isChecking && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-2">
          <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-300">
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">
              Connection restored.
            </span>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
