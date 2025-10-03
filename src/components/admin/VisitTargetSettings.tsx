import { useSystemSettings, useUpdateSystemSetting, useVisitDistanceValidation } from "@/hooks/useSystemSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Target, Save, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import React from "react";

export function VisitTargetSettings() {
  const { data: systemSettings, isLoading } = useSystemSettings();
  const { data: currentDistance = 25 } = useVisitDistanceValidation();
  const updateSetting = useUpdateSystemSetting();
  const { toast } = useToast();
  
  const [visitTarget, setVisitTarget] = useState<string>('15');
  const [distanceValidation, setDistanceValidation] = useState<string>('25');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDistance, setIsEditingDistance] = useState(false);

  // Set initial values when data loads
  React.useEffect(() => {
    if (systemSettings) {
      const targetSetting = systemSettings.find(s => s.setting_key === 'default_daily_visit_target');
      if (targetSetting) {
        setVisitTarget(targetSetting.setting_value);
      }
    }
  }, [systemSettings]);

  React.useEffect(() => {
    setDistanceValidation(currentDistance.toString());
  }, [currentDistance]);

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

  const handleSaveDistance = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'visit_distance_validation',
        value: distanceValidation,
        description: 'Maximum distance (in meters) allowed for visit location validation'
      });
      
      setIsEditingDistance(false);
      toast({
        title: "Distance validation updated",
        description: `Maximum distance has been set to ${distanceValidation} meters.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update distance validation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    const targetSetting = systemSettings?.find(s => s.setting_key === 'default_daily_visit_target');
    setVisitTarget(targetSetting?.setting_value || '15');
    setIsEditing(false);
  };

  const handleCancelDistance = () => {
    setDistanceValidation(currentDistance.toString());
    setIsEditingDistance(false);
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

        {/* Distance Validation Settings */}
        <div className="space-y-2 border-t pt-4">
          <Label htmlFor="distance-validation" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Visit Location Validation Distance
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="distance-validation"
              type="number"
              min="5"
              max="1000"
              value={distanceValidation}
              onChange={(e) => setDistanceValidation(e.target.value)}
              disabled={!isEditingDistance}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">meters radius</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum distance allowed between user location and lead location when recording visits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditingDistance ? (
            <>
              <Button 
                onClick={handleSaveDistance} 
                disabled={updateSetting.isPending}
                size="sm"
              >
                {updateSetting.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Distance
              </Button>
              <Button 
                onClick={handleCancelDistance} 
                variant="outline" 
                size="sm"
                disabled={updateSetting.isPending}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditingDistance(true)} 
              variant="outline" 
              size="sm"
            >
              Edit Distance
            </Button>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">Location Validation Impact</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>• Users must be within {distanceValidation}m of lead location to record visits</p>
            <p>• Prevents recording visits from incorrect locations</p>
            <p>• Requires location permissions to be enabled</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 