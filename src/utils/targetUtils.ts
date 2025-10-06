/**
 * Centralized utility for resolving user visit targets
 * Priority: User preference -> System default -> 15 (fallback)
 */

export interface UserPreferences {
  daily_visit_target?: number | null;
}

export interface SystemSetting {
  setting_key: string;
  setting_value: string;
}

/**
 * Get the daily visit target for a user
 * @param userId - The user ID
 * @param userPreferences - User's preferences object
 * @param systemSettings - Array of system settings
 * @returns The resolved daily visit target
 */
export function getUserVisitTarget(
  userId: string,
  userPreferences?: UserPreferences | null,
  systemSettings?: SystemSetting[]
): number {
  // 1. Check user's individual target first
  if (userPreferences?.daily_visit_target && userPreferences.daily_visit_target > 0) {
    return userPreferences.daily_visit_target;
  }
  
  // 2. Check system default
  const defaultTarget = systemSettings?.find(s => s.setting_key === 'default_daily_visit_target')?.setting_value;
  if (defaultTarget) {
    const parsed = parseInt(defaultTarget);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  
  // 3. Final fallback
  return 15;
}

/**
 * Get system default visit target
 * @param systemSettings - Array of system settings
 * @returns The system default target or 15 if not set
 */
export function getSystemDefaultVisitTarget(systemSettings?: SystemSetting[]): number {
  const defaultTarget = systemSettings?.find(s => s.setting_key === 'default_daily_visit_target')?.setting_value;
  if (defaultTarget) {
    const parsed = parseInt(defaultTarget);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 15;
}
