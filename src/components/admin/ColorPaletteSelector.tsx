
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { useToast } from "@/hooks/use-toast";
import { Palette, Check, Sparkles } from "lucide-react";
import { applyCustomColors } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const predefinedPalettes = [
  {
    name: "Jungle Green",
    description: "Professional green theme with neon accents",
    primary: "#228B22",
    secondary: "#f1f5f9",
    accent: "#39FF14",
    active: "#22c55e",
    inactive: "#ef4444",
    colors: ["#228B22", "#39FF14", "#ef4444", "#f97316"]
  },
  {
    name: "Ocean Blue",
    description: "Calming blue theme with cyan accents",
    primary: "#1e90ff",
    secondary: "#f1f5f9",
    accent: "#00bfff",
    active: "#0ea5e9",
    inactive: "#ef4444",
    colors: ["#1e90ff", "#00bfff", "#ef4444", "#f97316"]
  },
  {
    name: "Sunset Orange",
    description: "Warm orange theme with coral accents",
    primary: "#ff8c00",
    secondary: "#f1f5f9",
    accent: "#ff6347",
    active: "#f97316",
    inactive: "#ef4444",
    colors: ["#ff8c00", "#ff6347", "#ef4444", "#f97316"]
  },
  {
    name: "Forest Green",
    description: "Natural green theme with emerald accents",
    primary: "#228B22",
    secondary: "#f1f5f9",
    accent: "#50c878",
    active: "#10b981",
    inactive: "#ef4444",
    colors: ["#228B22", "#50c878", "#ef4444", "#f97316"]
  },
  {
    name: "Royal Purple",
    description: "Elegant purple theme with violet accents",
    primary: "#8b5cf6",
    secondary: "#f1f5f9",
    accent: "#a855f7",
    active: "#9333ea",
    inactive: "#ef4444",
    colors: ["#8b5cf6", "#a855f7", "#ef4444", "#f97316"]
  },
  {
    name: "Rose Pink",
    description: "Modern pink theme with rose accents",
    primary: "#ec4899",
    secondary: "#f1f5f9",
    accent: "#f472b6",
    active: "#e11d48",
    inactive: "#ef4444",
    colors: ["#ec4899", "#f472b6", "#ef4444", "#f97316"]
  },
];

export function ColorPaletteSelector() {
  const { user } = useAuth();
  const { data: systemSettings } = useSystemSettings();
  const updateSystemSetting = useUpdateSystemSetting();
  const { toast } = useToast();
  
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState({
    primary: "#228B22",
    secondary: "#f1f5f9",
    accent: "#39FF14",
    active: "#22c55e",
    inactive: "#ef4444",
  });

  // Load colors from system settings
  useEffect(() => {
    if (systemSettings) {
      const primaryColor = systemSettings.find(s => s.setting_key === 'system_primary_color')?.setting_value || "#3b82f6";
      const secondaryColor = systemSettings.find(s => s.setting_key === 'system_secondary_color')?.setting_value || "#f1f5f9";
      const accentColor = systemSettings.find(s => s.setting_key === 'system_accent_color')?.setting_value || "#10b981";
      const activeColor = systemSettings.find(s => s.setting_key === 'system_active_color')?.setting_value || "#22c55e";
      const inactiveColor = systemSettings.find(s => s.setting_key === 'system_inactive_color')?.setting_value || "#ef4444";
      
      setCustomColors({
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        active: activeColor,
        inactive: inactiveColor,
      });
    }
  }, [systemSettings]);

  const handlePaletteSelect = (palette: typeof predefinedPalettes[0]) => {
    setSelectedPalette(palette.name);
    setCustomColors({
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      active: palette.active,
      inactive: palette.inactive,
    });
  };

  const handleCustomColorChange = (colorType: keyof typeof customColors, color: string) => {
    setSelectedPalette(null);
    setCustomColors(prev => ({
      ...prev,
      [colorType]: color
    }));
  };

  const handleApplyColors = () => {
    // Apply colors immediately to CSS variables
    applyCustomColors({
      primary: customColors.primary,
      secondary: customColors.secondary,
      accent: customColors.accent,
      active: customColors.active,
      inactive: customColors.inactive,
    });
    
    toast({
      title: "Colors Applied",
      description: "Color palette applied to the interface",
    });
  };

  const handleSave = async () => {
    try {
      // Update all color settings in system settings
      await Promise.all([
        updateSystemSetting.mutateAsync({
          key: 'system_primary_color',
          value: customColors.primary,
          description: 'System primary color'
        }),
        updateSystemSetting.mutateAsync({
          key: 'system_secondary_color',
          value: customColors.secondary,
          description: 'System secondary color'
        }),
        updateSystemSetting.mutateAsync({
          key: 'system_accent_color',
          value: customColors.accent,
          description: 'System accent color'
        }),
        updateSystemSetting.mutateAsync({
          key: 'system_active_color',
          value: customColors.active,
          description: 'System active color'
        }),
        updateSystemSetting.mutateAsync({
          key: 'system_inactive_color',
          value: customColors.inactive,
          description: 'System inactive color'
        }),
      ]);
      
      // Apply colors immediately to CSS variables
      applyCustomColors({
        primary: customColors.primary,
        secondary: customColors.secondary,
        accent: customColors.accent,
        active: customColors.active,
        inactive: customColors.inactive,
      });
      
      toast({
        title: "Success",
        description: "Color palette saved and applied successfully",
      });
    } catch (error) {
      console.error('Error saving colors:', error);
      toast({
        title: "Error",
        description: "Failed to save color palette",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Predefined Palettes */}
      <Card className="bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Predefined Palettes
          </CardTitle>
          <CardDescription>
            Choose from our professionally designed color palettes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedPalettes.map((palette) => (
              <div
                key={palette.name}
                className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-lg shadow-md ${
                  selectedPalette === palette.name ? 'bg-primary/5 shadow-lg' : 'bg-card'
                }`}
                onClick={() => handlePaletteSelect(palette)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">{palette.name}</h3>
                  {selectedPalette === palette.name && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{palette.description}</p>
                <div className="flex gap-1">
                  {palette.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Colors */}
      <Card className="bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Custom Colors
          </CardTitle>
          <CardDescription>
            Customize your own color palette
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="primary-color"
                  type="color"
                  value={customColors.primary}
                  onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer shadow-sm"
                />
                <Input
                  value={customColors.primary}
                  onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="secondary-color"
                  type="color"
                  value={customColors.secondary}
                  onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer shadow-sm"
                />
                <Input
                  value={customColors.secondary}
                  onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                  placeholder="#f1f5f9"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="accent-color"
                  type="color"
                  value={customColors.accent}
                  onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer shadow-sm"
                />
                <Input
                  value={customColors.accent}
                  onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                  placeholder="#10b981"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Active Color */}
            <div className="space-y-2">
              <Label htmlFor="active-color">Active Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="active-color"
                  type="color"
                  value={customColors.active}
                  onChange={(e) => handleCustomColorChange('active', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer shadow-sm"
                />
                <Input
                  value={customColors.active}
                  onChange={(e) => handleCustomColorChange('active', e.target.value)}
                  placeholder="#22c55e"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Inactive Color */}
            <div className="space-y-2">
              <Label htmlFor="inactive-color">Inactive Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="inactive-color"
                  type="color"
                  value={customColors.inactive}
                  onChange={(e) => handleCustomColorChange('inactive', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer shadow-sm"
                />
                <Input
                  value={customColors.inactive}
                  onChange={(e) => handleCustomColorChange('inactive', e.target.value)}
                  placeholder="#ef4444"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 gap-2">
            <Button onClick={handleApplyColors} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Apply Colors
            </Button>
            <Button onClick={handleSave} disabled={updateSystemSetting.isPending}>
              {updateSystemSetting.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Palette'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
