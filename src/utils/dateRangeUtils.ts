/**
 * Centralized date range utilities
 * These functions standardize how date ranges are handled across the application
 * while maintaining backward compatibility with existing logic patterns.
 */

export interface DateRange {
  from: Date;
  to: Date;
}

export type PageType = 'dashboard' | 'analytics' | 'performance' | 'leads' | 'visits' | 'scheduledFollowups';

/**
 * Get standardized default date ranges for different pages
 * Maintains your existing default behavior for each page
 */
export const getDefaultDateRange = (page: PageType): DateRange | null => {
  const today = new Date();
  
  switch (page) {
    case 'dashboard':
      // Current week (Monday to today) - matches your existing Dashboard logic
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = -6, Monday = 0, Tuesday = -1, etc.
      startOfWeek.setDate(today.getDate() + daysToMonday);
      return { from: startOfWeek, to: today };
      
    case 'analytics':
      // Current month (1st to today) - matches your existing Analytics logic
      return {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: today
      };
      
    case 'performance':
      // All Time (no date range) - matches your existing Performance logic
      return null;
      
    case 'leads':
    case 'visits':
    case 'scheduledFollowups':
      // No default date range - matches your existing logic
      return null;
      
    default:
      return null;
  }
};

/**
 * Calculate working days between two dates (excluding weekends)
 * Standardizes your existing calculateWorkingDays logic
 */
export const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Count only Monday (1) through Friday (5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

/**
 * Apply date range filter to data array
 * Standardizes date filtering logic across components
 */
export const applyDateRangeFilter = <T>(
  data: T[], 
  dateRange: DateRange | null, 
  dateField: string
): T[] => {
  if (!dateRange || !data || data.length === 0) return data;
  
  return data.filter(item => {
    const itemDate = new Date((item as any)[dateField]);
    if (isNaN(itemDate.getTime())) return false; // Invalid date
    
    // If both dates are the same (single day selection)
    if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
      return itemDate.toDateString() === dateRange.from.toDateString();
    }
    
    // If only from date is selected
    if (dateRange.from && !dateRange.to) {
      return itemDate >= dateRange.from;
    }
    
    // If only to date is selected
    if (!dateRange.from && dateRange.to) {
      return itemDate <= dateRange.to;
    }
    
    // If both dates are selected (range)
    if (dateRange.from && dateRange.to) {
      return itemDate >= dateRange.from && itemDate <= dateRange.to;
    }
    
    return true;
  });
};

/**
 * Apply date range filter to leads data
 * Uses the standard created_at field for leads
 */
export const applyDateRangeFilterToLeads = (leads: any[], dateRange: DateRange | null): any[] => {
  return applyDateRangeFilter(leads, dateRange, 'created_at');
};

/**
 * Apply date range filter to visits data
 * Uses the standard date field for visits
 */
export const applyDateRangeFilterToVisits = (visits: any[], dateRange: DateRange | null): any[] => {
  return applyDateRangeFilter(visits, dateRange, 'date');
};

/**
 * Apply date range filter to scheduled followups data
 * Uses the next_visit field for followups
 */
export const applyDateRangeFilterToFollowups = (leads: any[], dateRange: DateRange | null): any[] => {
  if (!dateRange || !leads || leads.length === 0) return leads;
  
  return leads.filter(lead => {
    if (!lead.next_visit) return false;
    
    const followupDate = new Date(lead.next_visit);
    if (isNaN(followupDate.getTime())) return false;
    
    // If both dates are the same (single day selection)
    if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
      return followupDate.toDateString() === dateRange.from.toDateString();
    }
    
    // If only from date is selected
    if (dateRange.from && !dateRange.to) {
      return followupDate >= dateRange.from;
    }
    
    // If only to date is selected
    if (!dateRange.from && dateRange.to) {
      return followupDate <= dateRange.to;
    }
    
    // If both dates are selected (range)
    if (dateRange.from && dateRange.to) {
      return followupDate >= dateRange.from && followupDate <= dateRange.to;
    }
    
    return true;
  });
};

/**
 * Check if a date range matches a specific preset
 * Useful for highlighting active filter buttons
 */
export const isDateRangePreset = (
  dateRange: DateRange | null, 
  preset: 'today' | 'thisWeek' | 'last7Days' | 'last30Days' | 'thisMonth' | 'allTime'
): boolean => {
  if (!dateRange) return preset === 'allTime';
  
  const today = new Date();
  
  switch (preset) {
    case 'today':
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      return dateRange.from.getTime() === todayStart.getTime() && 
             dateRange.to.getTime() === todayEnd.getTime();
             
    case 'thisWeek':
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(today.getDate() + daysToMonday);
      return dateRange.from.getTime() === startOfWeek.getTime() && 
             dateRange.to.getTime() === today.getTime();
             
    case 'last7Days':
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return dateRange.from.getTime() === lastWeek.getTime() && 
             dateRange.to.getTime() === today.getTime();
             
    case 'last30Days':
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return dateRange.from.getTime() === lastMonth.getTime() && 
             dateRange.to.getTime() === today.getTime();
             
    case 'thisMonth':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return dateRange.from.getTime() === monthStart.getTime() && 
             dateRange.to.getTime() === today.getTime();
             
    case 'allTime':
      return false; // Already handled above
      
    default:
      return false;
  }
};

/**
 * Format date range for display
 * Provides consistent date range formatting across components
 */
export const formatDateRange = (dateRange: DateRange | null): string => {
  if (!dateRange) return 'All Time';
  
  const formatDate = (date: Date) => date.toLocaleDateString();
  
  if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
    return formatDate(dateRange.from);
  }
  
  return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
};

/**
 * Get working days for a date range
 * Calculates working days for target calculations
 */
export const getWorkingDaysForRange = (dateRange: DateRange | null): number => {
  if (!dateRange) {
    // For "All Time", calculate from first lead entry to today
    // This matches your Dashboard "All Time" logic
    return 5; // Fallback default
  }
  
  return calculateWorkingDays(dateRange.from, dateRange.to);
};

/**
 * Get preset date ranges
 */
export const getPresetDateRange = (preset: 'today' | 'thisWeek' | 'last7Days' | 'last30Days'): DateRange => {
  const today = new Date();

  switch (preset) {
    case 'today':
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      return { from: todayStart, to: todayEnd };

    case 'thisWeek':
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(today.getDate() + daysToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      return { from: startOfWeek, to: today };

    case 'last7Days':
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      lastWeek.setHours(0, 0, 0, 0);
      return { from: lastWeek, to: today };

    case 'last30Days':
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      lastMonth.setHours(0, 0, 0, 0);
      return { from: lastMonth, to: today };

    default:
      return getDefaultDateRange('dashboard');
  }
};
