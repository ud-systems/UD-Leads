// Enhanced Supabase client with connection management
import { getSupabaseClient, checkConnectionHealth, withRetry } from './connectionManager';
import type { Database } from './types';

// Export the managed client
export const supabase = getSupabaseClient();

// Re-export connection utilities for backward compatibility
export { checkConnectionHealth, withRetry } from './connectionManager';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";