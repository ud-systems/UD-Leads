import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useToast } from '../../hooks/use-toast';

export const PushNotificationSettings: React.FC = () => {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush
  } = usePushNotifications();
  
  const { toast } = useToast();

  const handleToggleNotifications = async () => {
    toast({
      title: "Feature Disabled",
      description: "Push notifications are currently disabled in this version.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellOff className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Currently disabled in this version
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications" className="text-base">
              Message Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Push notifications are currently disabled
            </p>
          </div>
          <Switch
            id="notifications"
            checked={false}
            onCheckedChange={handleToggleNotifications}
            disabled={true}
          />
        </div>

        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Push notifications will be available in a future update. For now, you can still receive in-app notifications for new messages.
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• In-app notifications are still available</p>
          <p>• Check the Messages page for new conversations</p>
          <p>• Push notifications will be re-enabled in a future update</p>
        </div>
      </CardContent>
    </Card>
  );
}; 