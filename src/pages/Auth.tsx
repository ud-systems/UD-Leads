
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
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { primaryColor, secondaryColor, accentColor, activeColor, inactiveColor, systemTheme } = useSystemThemeColors();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast({
          title: "Error",
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
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
