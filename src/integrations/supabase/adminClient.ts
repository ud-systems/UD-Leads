import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = "https://uiprdzdskaqakfwhzssc.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY1MzIzMiwiZXhwIjoyMDY4MjI5MjMyfQ.bzQCRiKu7eayFZNVsCZn8vb4ngUt9prl5jDxUPJHQaE";

// Create a singleton admin client to prevent multiple instances
let adminClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabaseAdmin = (() => {
  if (!adminClientInstance) {
    adminClientInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        },
        storageKey: 'supabase-admin-storage-unique'
      },
      global: {
        headers: {
          'X-Client-Info': 'retail-lead-compass-admin-unique'
        },
        // Add fetch configuration with timeout for admin operations
        fetch: (url, options = {}) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for admin operations
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => {
            clearTimeout(timeoutId);
          });
        }
      },
      db: {
        schema: 'public'
      }
    });
  }
  return adminClientInstance;
})();

// Helper function to check if admin client is properly configured
export const isAdminClientConfigured = () => {
  return !!supabaseServiceKey && supabaseServiceKey.length > 0;
}; 