import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Color conversion utilities
export function hexToHsl(hex: string): string {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  
  // Convert to degrees and percentages
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return `${h} ${s}% ${lPercent}%`;
}

// Theme-aware color generation for lead statuses and store types
export function generateThemeAwareColors(baseColor: string, isDark: boolean = false) {
  const hsl = hexToHsl(baseColor);
  const [h, s, l] = hsl.split(' ').map(val => parseFloat(val));
  
  // Adjust lightness based on theme
  const bgLightness = isDark ? Math.max(l - 15, 10) : Math.min(l + 20, 95);
  const borderLightness = isDark ? Math.max(l - 8, 15) : Math.min(l + 10, 90);
  const textLightness = isDark ? Math.min(l + 30, 95) : Math.max(l - 30, 10);
  
  return {
    background: `hsl(${h} ${s}% ${bgLightness}%)`,
    border: `hsl(${h} ${s}% ${borderLightness}%)`,
    text: `hsl(${h} ${s}% ${textLightness}%)`,
    hover: `hsl(${h} ${s}% ${isDark ? bgLightness + 5 : bgLightness - 5}%)`,
  };
}

// Lead status color mapping
export const LEAD_STATUS_COLORS = {
  'New Prospect': '#3b82f6', // Blue
  'In Discussion': '#f59e0b', // Amber
  'Trial Order': '#8b5cf6', // Purple
  'Converted': '#10b981', // Green
  'Lost': '#ef4444', // Red
  'On Hold': '#6b7280', // Gray
  'Follow Up': '#06b6d4', // Cyan
  'Qualified': '#84cc16', // Lime
  'Disqualified': '#f97316', // Orange
  'No Status': '#9ca3af', // Gray
};

// Store type color mapping
export const STORE_TYPE_COLORS = {
  'Retail Store': '#3b82f6', // Blue
  'Supermarket': '#10b981', // Green
  'Convenience Store': '#f59e0b', // Amber
  'Department Store': '#8b5cf6', // Purple
  'Specialty Store': '#06b6d4', // Cyan
  'Online Store': '#84cc16', // Lime
  'Wholesale': '#f97316', // Orange
  'Hypermarket': '#ec4899', // Pink
  'Discount Store': '#22c55e', // Emerald
  'Boutique': '#a855f7', // Violet
  'Chain Store': '#0ea5e9', // Sky
  'Independent': '#64748b', // Slate
  'Franchise': '#fbbf24', // Yellow
  'Market': '#059669', // Emerald
  'Kiosk': '#dc2626', // Red
};

// Get theme-aware colors for lead status
export function getLeadStatusColors(status: string, isDark: boolean = false) {
  const baseColor = LEAD_STATUS_COLORS[status as keyof typeof LEAD_STATUS_COLORS] || LEAD_STATUS_COLORS['No Status'];
  return generateThemeAwareColors(baseColor, isDark);
}

// Get theme-aware colors for store type
export function getStoreTypeColors(storeType: string, isDark: boolean = false) {
  const baseColor = STORE_TYPE_COLORS[storeType as keyof typeof STORE_TYPE_COLORS] || STORE_TYPE_COLORS['Independent'];
  return generateThemeAwareColors(baseColor, isDark);
}

// Get CSS classes for lead status badges
export function getLeadStatusClasses(status: string, isDark: boolean = false) {
  const colors = getLeadStatusColors(status, isDark);
  return {
    background: colors.background,
    borderColor: colors.border,
    color: colors.text,
    '--tw-ring-color': colors.border,
  };
}

// Get CSS classes for store type badges
export function getStoreTypeClasses(storeType: string, isDark: boolean = false) {
  const colors = getStoreTypeColors(storeType, isDark);
  return {
    background: colors.background,
    borderColor: colors.border,
    color: colors.text,
    '--tw-ring-color': colors.border,
  };
}

// Get hover styles for interactive elements
export function getHoverStyles(baseColor: string, isDark: boolean = false) {
  const colors = generateThemeAwareColors(baseColor, isDark);
  return {
    '&:hover': {
      backgroundColor: colors.hover,
    },
  };
}

export function applyCustomColors(colors: {
  primary?: string;
  secondary?: string;
  accent?: string;
  active?: string;
  inactive?: string;
}) {
  const root = document.documentElement;
  
  if (colors.primary) {
    const primaryHsl = hexToHsl(colors.primary);
    root.style.setProperty('--primary', primaryHsl);
    
    // Update gradient variables based on primary color
    const [h, s, l] = primaryHsl.split(' ').map(val => parseFloat(val));
    const lighterL = Math.min(l + 12, 100);
    const darkerL = Math.max(l - 8, 0);
    
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${h} ${s}% ${l}%) 0%, hsl(${h} ${s}% ${lighterL}%) 100%)`);
    root.style.setProperty('--gradient-primary-subtle', `linear-gradient(135deg, hsl(${h} ${s}% ${l}%) 0%, hsl(${h} ${s}% ${Math.min(l + 6, 100)}%) 100%)`);
    root.style.setProperty('--gradient-sidebar', `linear-gradient(180deg, hsl(${h} ${s}% ${l}%) 0%, hsl(${h} ${s}% ${darkerL}%) 100%)`);
    root.style.setProperty('--gradient-button', `linear-gradient(135deg, hsl(${h} ${s}% ${l}%) 0%, hsl(${h} ${s}% ${Math.min(l + 6, 100)}%) 100%)`);
    root.style.setProperty('--gradient-button-hover', `linear-gradient(135deg, hsl(${h} ${s}% ${Math.min(l + 6, 100)}%) 0%, hsl(${h} ${s}% ${lighterL}%) 100%)`);
  }
  
  if (colors.secondary) {
    const secondaryHsl = hexToHsl(colors.secondary);
    root.style.setProperty('--secondary', secondaryHsl);
    
    // Update secondary gradient
    const [h, s, l] = secondaryHsl.split(' ').map(val => parseFloat(val));
    const lighterL = Math.min(l + 4, 100);
    root.style.setProperty('--gradient-accent', `linear-gradient(135deg, hsl(${h} ${s}% ${l}%) 0%, hsl(${h} ${s}% ${lighterL}%) 100%)`);
  }
  
  if (colors.accent) {
    root.style.setProperty('--accent', hexToHsl(colors.accent));
  }
  if (colors.active) {
    root.style.setProperty('--active', hexToHsl(colors.active));
  }
  if (colors.inactive) {
    root.style.setProperty('--inactive', hexToHsl(colors.inactive));
  }
}
