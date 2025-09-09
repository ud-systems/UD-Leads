import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { runConnectionDiagnostics, type ConnectionDiagnostics } from '@/utils/connectionDiagnostics';

export const ConnectionStatus: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<ConnectionDiagnostics | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const results = await runConnectionDiagnostics();
      setDiagnostics(results);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run initial diagnostics
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "Connected" : "Disconnected"}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Connection Status
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isRunning}
            className="ml-auto"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </CardTitle>
        {lastChecked && (
          <p className="text-sm text-muted-foreground">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnostics ? (
          <>
            {/* Network Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {diagnostics.networkStatus === 'online' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span>Network</span>
              </div>
              {getStatusBadge(diagnostics.networkStatus === 'online')}
            </div>

            {/* Supabase Reachability */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostics.supabaseReachable)}
                <span>Supabase URL</span>
              </div>
              {getStatusBadge(diagnostics.supabaseReachable)}
            </div>

            {/* Auth Service */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostics.authServiceReachable)}
                <span>Auth Service</span>
              </div>
              {getStatusBadge(diagnostics.authServiceReachable)}
            </div>

            {/* Database */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostics.databaseReachable)}
                <span>Database</span>
              </div>
              {getStatusBadge(diagnostics.databaseReachable)}
            </div>

            {/* Errors */}
            {diagnostics.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600">Errors:</h4>
                <ul className="space-y-1">
                  {diagnostics.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {diagnostics.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-600">Recommendations:</h4>
                <ul className="space-y-1">
                  {diagnostics.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* URL Info */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Supabase URL:</strong> {diagnostics.url}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Running diagnostics...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
