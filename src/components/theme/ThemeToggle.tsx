
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "./ThemeProvider"
import { useUpdateSystemSetting } from "@/hooks/useSystemSettings"
import { useToast } from "@/hooks/use-toast"

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const updateSystemSetting = useUpdateSystemSetting()
  const { toast } = useToast()

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
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
