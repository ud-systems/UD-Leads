import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Monitor, Palette, Loader2 } from "lucide-react";

export function SystemThemeManager() {
  const { theme, setTheme } = useTheme();
  const updateSystemSetting = useUpdateSystemSetting();
  const { toast } = useToast();

  const themeOptions = [
    {
      value: "light",
      label: "Light Mode",
      description: "Clean, bright interface for daytime use",
      icon: Sun,
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    },
    {
      value: "dark",
      label: "Dark Mode",
      description: "Easy on the eyes for low-light environments",
      icon: Moon,
      color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
    },
    {
      value: "system",
      label: "System Default",
      description: "Automatically follows your device settings",
      icon: Monitor,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }
  ];

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      await updateSystemSetting.mutateAsync({
        key: 'system_theme',
        value: newTheme,
        description: 'System-wide theme setting (light, dark, or system)'
      });
      
      // Update local state immediately
      setTheme(newTheme);
      
      // Update localStorage as backup
      localStorage.setItem('retail-lead-compass-theme', newTheme);
      
      toast({
        title: "Theme Updated",
        description: `System theme changed to ${newTheme} mode`,
      });
    } catch (error) {
      console.error('Error updating theme:', error)
      toast({
        title: "Error",
        description: "Failed to update system theme",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Theme Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Current Theme</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Choose how UD Retail Leads looks and feels across the entire system
            </p>
          </div>

          {/* Theme Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              const isLoading = updateSystemSetting.isPending;
              
              return (
                <div
                  key={option.value}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isLoading && handleThemeChange(option.value as 'light' | 'dark' | 'system')}
                >
                  {isActive && (
                    <Badge className="absolute -top-2 -right-2" variant="default">
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Active'
                      )}
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${option.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{option.label}</h3>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Quick Theme Toggle</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Use this button to quickly switch between light and dark modes
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Theme Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Theme Preview</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'System Default'}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Additional Settings</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-sm font-medium">Auto-switch based on time</span>
                  <p className="text-xs text-muted-foreground">Automatically switch themes at sunrise/sunset</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-sm font-medium">High contrast mode</span>
                  <p className="text-xs text-muted-foreground">Enhanced contrast for better accessibility</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 