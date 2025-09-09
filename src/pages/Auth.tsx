
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSystemThemeColors } from "@/hooks/useSystemSettings";
import { applyCustomColors } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const { signIn, user, loading, connectionHealthy } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { primaryColor, secondaryColor, accentColor, activeColor, inactiveColor, systemTheme } = useSystemThemeColors();
  
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Check connection health on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { getConnectionManager } = await import('@/integrations/supabase/connectionManager');
        const manager = getConnectionManager();
        await manager.forceHealthCheck();
        
        const healthStatus = manager.getHealthStatus();
        const currentStrategy = manager.getCurrentStrategy();
        
        // Check if any strategy is healthy
        const isHealthy = Array.from(healthStatus.values()).some(status => status.healthy);
        setConnectionStatus(isHealthy ? 'healthy' : 'unhealthy');
        
        console.log('Connection status:', {
          currentStrategy,
          healthStatus: Object.fromEntries(healthStatus),
          isHealthy
        });
      } catch (error) {
        console.error('Connection health check failed:', error);
        setConnectionStatus('unhealthy');
      }
    };

    checkConnection();
  }, []);

  // Apply system theme colors with fallback
  useEffect(() => {
    // Only apply if we have valid colors
    if (primaryColor && secondaryColor && accentColor && activeColor && inactiveColor) {
      applyCustomColors({
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        active: activeColor,
        inactive: inactiveColor,
      });
    }
  }, [primaryColor, secondaryColor, accentColor, activeColor, inactiveColor]);

  // Apply system theme with fallback
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (systemTheme === "system") {
      const systemThemeValue = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemThemeValue);
    } else if (systemTheme === "dark" || systemTheme === "light") {
      root.classList.add(systemTheme);
    } else {
      // Fallback to system preference
      const systemThemeValue = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemThemeValue);
    }
  }, [systemTheme]);

  // Redirect if already authenticated
  if (user) {
    navigate("/");
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Check connection health before attempting login
      if (connectionStatus === 'unhealthy') {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Successfully signed in!",
        });
        navigate("/");
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Radial gradient background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at center, ${primaryColor || '#3b82f6'} 0%, ${secondaryColor || '#60a5fa'} 30%, ${accentColor || '#93c5fd'} 60%, transparent 100%)`,
        }}
      />
      {/* Content overlay */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-primary">UD Retail Leads</CardTitle>
            <CardDescription className="text-base">
              Sign in to your account
            </CardDescription>
            {/* Connection Status Indicator */}
            <div className="flex items-center justify-center mt-2">
              <div className={`flex items-center space-x-2 text-sm ${
                connectionStatus === 'healthy' ? 'text-green-600' : 
                connectionStatus === 'unhealthy' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'healthy' ? 'bg-green-500' : 
                  connectionStatus === 'unhealthy' ? 'bg-red-500' : 
                  'bg-yellow-500 animate-pulse'
                }`} />
                <span>
                  {connectionStatus === 'healthy' ? 'Connected' : 
                   connectionStatus === 'unhealthy' ? 'Connection Issues' : 
                   'Checking Connection...'}
                </span>
              </div>
            </div>
            
            {/* Connection Issues Help */}
            {connectionStatus === 'unhealthy' && (
              <div className="mt-2 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Having trouble connecting? The system is trying multiple connection methods.
                </p>
                <p className="text-xs text-blue-600">
                  💡 Please check your internet connection and try again.
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-background border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-background border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || connectionStatus === 'unhealthy'}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : connectionStatus === 'unhealthy' ? (
                  "Connection Issues"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
