import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wifi, WifiOff, Globe, Shield, AlertTriangle } from 'lucide-react';
import { runConnectionDiagnostics, getConnectionStatusMessage, type ConnectionDiagnostic } from '@/utils/connectionDiagnostics';

export function ConnectionTroubleshooter() {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostic, setDiagnostic] = useState<ConnectionDiagnostic | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const result = await runConnectionDiagnostics();
      setDiagnostic(result);
      setLastRun(new Date());
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "Working" : "Failed"}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <span>Connection Troubleshooter</span>
        </CardTitle>
        <CardDescription>
          Diagnose connection issues and get recommendations for fixing them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            <span>{isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}</span>
          </Button>
          
          {lastRun && (
            <span className="text-sm text-muted-foreground">
              Last run: {lastRun.toLocaleTimeString()}
            </span>
          )}
        </div>

        {diagnostic && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Alert className={diagnostic.supabaseAccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {getConnectionStatusMessage(diagnostic)}
              </AlertDescription>
            </Alert>

            {/* Test Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(diagnostic.networkConnectivity)}
                  <span className="font-medium">Network</span>
                </div>
                {getStatusBadge(diagnostic.networkConnectivity)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(diagnostic.dnsResolution)}
                  <span className="font-medium">DNS</span>
                </div>
                {getStatusBadge(diagnostic.dnsResolution)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(diagnostic.supabaseAccess)}
                  <span className="font-medium">Supabase</span>
                </div>
                {getStatusBadge(diagnostic.supabaseAccess)}
              </div>
            </div>

            {/* Region Info */}
            {diagnostic.region && diagnostic.region !== 'unknown' && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Detected Region:</span>
                  <Badge variant="outline">{diagnostic.region}</Badge>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {diagnostic.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recommendations:</h4>
                <ul className="space-y-1">
                  {diagnostic.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* VPN Suggestion */}
            {!diagnostic.supabaseAccess && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Quick Fix:</strong> Try using a VPN with UK, US, or EU servers. 
                  Many users report success with VPN services when experiencing connection issues.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
