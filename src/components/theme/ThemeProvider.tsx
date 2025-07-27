
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { applyCustomColors } from "@/lib/utils"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Helper function to get theme from localStorage
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem('retail-lead-compass-theme')
  return (stored as Theme) || 'system'
}

// Helper function to store theme in localStorage
const setStoredTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('retail-lead-compass-theme', theme)
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  ...props
}: ThemeProviderProps) {
  const { user } = useAuth()
  const { data: preferences } = useUserPreferences(user?.id)
  const { data: systemSettings, isLoading: systemSettingsLoading, refetch } = useSystemSettings()
  
  // Get system theme from admin settings - this is the primary source of truth
  const systemThemeSetting = systemSettings?.find(s => s.setting_key === 'system_theme')
  const systemTheme = systemThemeSetting ? (systemThemeSetting.setting_value as Theme) : defaultTheme
  
  // Initialize with stored theme or system theme
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = getStoredTheme()
    return storedTheme !== 'system' ? storedTheme : systemTheme
  })
  const [isInitialized, setIsInitialized] = useState(false)

  // Update theme when system settings change and are loaded
  useEffect(() => {
    if (!systemSettingsLoading && systemSettings) {
      console.log('Theme: Loading from system settings:', systemTheme)
      setTheme(systemTheme)
      setStoredTheme(systemTheme) // Update localStorage
      setIsInitialized(true)
    }
  }, [systemTheme, systemSettingsLoading, systemSettings])

  // Force refresh system settings when theme changes locally
  useEffect(() => {
    if (isInitialized && theme !== systemTheme) {
      console.log('Theme: Mismatch detected, refreshing settings')
      refetch()
    }
  }, [theme, systemTheme, isInitialized, refetch])

  // Apply theme to document only after initialization
  useEffect(() => {
    if (!isInitialized) return

    console.log('Theme: Applying to document:', theme)
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme, isInitialized])

  // Apply system colors - these are managed by admin in system settings
  useEffect(() => {
    if (systemSettings && isInitialized) {
      const primaryColor = systemSettings.find(s => s.setting_key === 'system_primary_color')?.setting_value || '#3b82f6'
      const secondaryColor = systemSettings.find(s => s.setting_key === 'system_secondary_color')?.setting_value || '#f1f5f9'
      const accentColor = systemSettings.find(s => s.setting_key === 'system_accent_color')?.setting_value || '#10b981'
      const activeColor = systemSettings.find(s => s.setting_key === 'system_active_color')?.setting_value || '#22c55e'
      const inactiveColor = systemSettings.find(s => s.setting_key === 'system_inactive_color')?.setting_value || '#ef4444'
      
      applyCustomColors({
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        active: activeColor,
        inactive: inactiveColor,
      });
    }
  }, [systemSettings, isInitialized])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      console.log('Theme: Setting to:', theme)
      setTheme(theme)
      setStoredTheme(theme) // Update localStorage immediately
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
