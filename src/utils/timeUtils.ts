/**
 * Utility functions for handling UK timezone (GMT/BST) consistently across the application
 */

/**
 * Get current date and time in UK timezone
 */
export function getUKDateTime(): { date: string; time: string; iso: string } {
  const now = new Date();
  
  // Get UK time components directly
  const ukDateStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/London" }); // YYYY-MM-DD format
  const ukTimeStr = now.toLocaleTimeString("en-GB", { 
    timeZone: "Europe/London", 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }); // HH:MM:SS format
  
  // Create a proper ISO string for UK timezone
  const ukISO = `${ukDateStr}T${ukTimeStr}+00:00`; // Use +00:00 for GMT, +01:00 for BST
  
  return {
    date: ukDateStr,
    time: ukTimeStr,
    iso: ukISO
  };
}

/**
 * Convert any date/time to UK timezone
 */
export function toUKDateTime(dateTime: string | Date): { date: string; time: string; iso: string } {
  const date = new Date(dateTime);
  
  // Get UK time components directly
  const ukDateStr = date.toLocaleDateString("en-CA", { timeZone: "Europe/London" }); // YYYY-MM-DD format
  const ukTimeStr = date.toLocaleTimeString("en-GB", { 
    timeZone: "Europe/London", 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }); // HH:MM:SS format
  
  // Create a proper ISO string for UK timezone
  const ukISO = `${ukDateStr}T${ukTimeStr}+00:00`; // Use +00:00 for GMT, +01:00 for BST
  
  return {
    date: ukDateStr,
    time: ukTimeStr,
    iso: ukISO
  };
}

/**
 * Get current UK time in HH:MM format (for form inputs)
 */
export function getUKTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-GB", { 
    timeZone: "Europe/London", 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }); // HH:MM format
}

/**
 * Get current UK date in YYYY-MM-DD format (for form inputs)
 */
export function getUKDate(): string {
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/London" }); // YYYY-MM-DD format
}

/**
 * Format a date for display in UK timezone
 */
export function formatUKDate(date: string | Date): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-GB', {
    timeZone: "Europe/London",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Format a time for display in UK timezone
 */
export function formatUKTime(time: string): string {
  // If time is already in HH:MM:SS format, just return it
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return time;
  }
  
  // If time is in HH:MM format, add seconds
  if (time.match(/^\d{2}:\d{2}$/)) {
    return time + ':00';
  }
  
  return time;
}
