// Enhanced Supabase client with regional access fixes
import { supabase as resilientClient, testConnection } from './directConnection';
import { getSupabaseClient, checkConnectionHealth, withRetry } from './connectionManager';
import type { Database } from './types';

// Export the resilient client that bypasses regional restrictions
export const supabase = resilientClient;

// Test connection on import
testConnection().then(success => {
  if (success) {
    console.log('✅ Supabase connection established successfully');
  } else {
    console.warn('⚠️ Supabase connection test failed, but client is still available');
  }
}).catch(error => {
  console.warn('⚠️ Connection test error:', error);
});

// Re-export connection utilities for backward compatibility
export { checkConnectionHealth, withRetry } from './connectionManager';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";