import { useSystemSettings, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Target, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import React from "react";

export function VisitTargetSettings() {
  const { data: systemSettings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const { toast } = useToast();
  
  const [visitTarget, setVisitTarget] = useState<string>('15');
  const [isEditing, setIsEditing] = useState(false);

  // Set initial value when data loads
  React.useEffect(() => {
    if (systemSettings) {
      const targetSetting = systemSettings.find(s => s.setting_key === 'default_daily_visit_target');
      if (targetSetting) {
        setVisitTarget(targetSetting.setting_value);
      }
    }
  }, [systemSettings]);

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'default_daily_visit_target',
        value: visitTarget
      });
      
      setIsEditing(false);
      toast({
        title: "Visit target updated",
        description: `Daily visit target has been set to ${visitTarget} visits.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update visit target. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    const targetSetting = systemSettings?.find(s => s.setting_key === 'default_daily_visit_target');
    setVisitTarget(targetSetting?.setting_value || '15');
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Visit Target Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Visit Target Settings
        </CardTitle>
        <CardDescription>
          Configure the default daily visit target for salespersons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="visit-target">Default Daily Visit Target</Label>
          <div className="flex items-center gap-2">
            <Input
              id="visit-target"
              type="number"
              min="1"
              max="50"
              value={visitTarget}
              onChange={(e) => setVisitTarget(e.target.value)}
              disabled={!isEditing}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">visits per day</span>
          </div>
          <p className="text-xs text-muted-foreground">
            This target will be applied to all new salespersons and can be overridden individually.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button 
                onClick={handleSave} 
                disabled={updateSetting.isPending}
                size="sm"
              >
                {updateSetting.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                size="sm"
                disabled={updateSetting.isPending}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="outline" 
              size="sm"
            >
              Edit
            </Button>
          )}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Current Impact</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• New salespersons will have a default target of {visitTarget} visits per day</p>
            <p>• Existing salespersons will keep their current targets</p>
            <p>• Individual targets can be adjusted in user management</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 