import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { clearAllCaches, updateServiceWorker, isDevelopment } from '@/utils/cacheUtils';
import { useToast } from '@/hooks/use-toast';

export function CacheManager() {
  const [isClearing, setIsClearing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleClearCaches = async () => {
    setIsClearing(true);
    try {
      await clearAllCaches();
      toast({
        title: "Caches Cleared",
        description: "All caches have been cleared and the page will reload.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear caches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleUpdateServiceWorker = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker();
      toast({
        title: "Service Worker Updated",
        description: "Service worker has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service worker.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Only show in development or if explicitly enabled
  if (!isDevelopment() && localStorage.getItem('show-cache-manager') !== 'true') {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Cache Manager
          <Badge variant="outline">Debug</Badge>
        </CardTitle>
        <CardDescription>
          Manage application caches and service worker updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={handleClearCaches}
            disabled={isClearing}
            variant="destructive"
            className="w-full"
          >
            {isClearing ? "Clearing..." : "Clear All Caches"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Clears all caches and reloads the page. Use when changes don't appear.
          </p>
        </div>
        
        <div className="space-y-2">
          <Button
            onClick={handleUpdateServiceWorker}
            disabled={isUpdating}
            variant="outline"
            className="w-full"
          >
            {isUpdating ? "Updating..." : "Update Service Worker"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Forces service worker to check for updates.
          </p>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> If you're not seeing changes after deployment, 
            try clearing caches first.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
