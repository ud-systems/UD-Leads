import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Wifi, 
  WifiOff, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Download,
  Clock
} from "lucide-react";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { cn } from "@/lib/utils";

interface OfflineStatusIndicatorProps {
  className?: string;
  showSyncButton?: boolean;
  showExportButton?: boolean;
}

export function OfflineStatusIndicator({ 
  className, 
  showSyncButton = true,
  showExportButton = true 
}: OfflineStatusIndicatorProps) {
  const { 
    isOnline, 
    syncMetadata, 
    getPendingCount, 
    triggerSync, 
    exportOfflineData 
  } = useOfflineStorage();
  
  const { 
    status: connectionStatus, 
    isConnected: isSupabaseConnected,
    checkConnection 
  } = useConnectionStatus();
  
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const pendingCount = getPendingCount();

  const handleManualSync = async () => {
    if (!isOnline || pendingCount === 0) return;
    
    setIsManualSyncing(true);
    try {
      await triggerSync();
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    if (!isSupabaseConnected) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (syncMetadata.syncStatus === 'syncing') {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (syncMetadata.syncStatus === 'error') {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    
    if (pendingCount > 0) {
      return <Upload className="h-4 w-4 text-yellow-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) {
      return "Offline";
    }
    
    if (!isSupabaseConnected) {
      return "Server Error";
    }
    
    if (syncMetadata.syncStatus === 'syncing') {
      return "Syncing...";
    }
    
    if (syncMetadata.syncStatus === 'error') {
      return `Sync Error (${syncMetadata.retryCount}/3)`;
    }
    
    if (pendingCount > 0) {
      return `Pending Sync (${pendingCount})`;
    }
    
    return "All Synced";
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    
    if (!isSupabaseConnected) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    
    if (syncMetadata.syncStatus === 'syncing') {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    
    if (syncMetadata.syncStatus === 'error') {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    
    if (pendingCount > 0) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getTooltipContent = () => {
    if (!isOnline) {
      return "You're offline. Data will be saved locally and synced when connection is restored.";
    }
    
    if (!isSupabaseConnected) {
      return "Unable to connect to server. Data will be saved locally and synced when connection is restored.";
    }
    
    if (syncMetadata.syncStatus === 'syncing') {
      return "Syncing offline data to database...";
    }
    
    if (syncMetadata.syncStatus === 'error') {
      return `Sync failed after ${syncMetadata.retryCount} attempts. ${syncMetadata.lastError || 'Unknown error'}`;
    }
    
    if (pendingCount > 0) {
      return `${pendingCount} lead(s) waiting to sync. Click to sync now.`;
    }
    
    return "All data is synced with the database.";
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn("flex items-center gap-1 cursor-pointer", getStatusColor())}
            >
              {getStatusIcon()}
              <span className="text-xs font-medium">{getStatusText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>

        {/* Manual Connection Check Button */}
        {!isSupabaseConnected && isOnline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={checkConnection}
                className="h-7 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Check server connection</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Manual Sync Button */}
        {showSyncButton && isOnline && isSupabaseConnected && pendingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualSync}
                disabled={isManualSyncing || syncMetadata.syncStatus === 'syncing'}
                className="h-7 px-2"
              >
                {isManualSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sync offline data now</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Export Button */}
        {showExportButton && (pendingCount > 0 || syncMetadata.syncStatus === 'error') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={exportOfflineData}
                className="h-7 px-2"
              >
                <Download className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export offline data as CSV</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Last Sync Time */}
        {isOnline && syncMetadata.lastSyncTimestamp > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  Last sync: {new Date(syncMetadata.lastSyncTimestamp).toLocaleTimeString()}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last successful sync time</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
