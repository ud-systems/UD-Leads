import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Get configuration from environment variables or fallback to hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://uiprdzdskaqakfwhzssc.supabase.co";
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY1MzIzMiwiZXhwIjoyMDY4MjI5MjMyfQ.bzQCRiKu7eayFZNVsCZn8vb4ngUt9prl5jDxUPJHQaE";

// Global flag to prevent multiple admin client instances
let isAdminClientInitialized = false;

// Create a singleton admin client to prevent multiple instances
let adminClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabaseAdmin = (() => {
  if (!adminClientInstance) {
    // Prevent multiple admin client instances
    if (isAdminClientInitialized) {
      console.warn('Supabase admin client already initialized, returning existing instance');
    }
    
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
        // Enhanced fetch configuration with better error handling
        fetch: (url, options = {}) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for faster response
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).catch((error) => {
            // Handle different types of connection errors
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
              console.error('Network error for Supabase admin URL:', url);
              throw new Error('Unable to connect to the admin server. This may be due to regional restrictions. Please try using a VPN or check your internet connection.');
            } else if (error.name === 'AbortError') {
              console.error('Request timeout for Supabase admin URL:', url);
              throw new Error('Admin server connection timeout. The server is taking too long to respond. Please try again or use a VPN.');
            }
            throw error;
          }).finally(() => {
            clearTimeout(timeoutId);
          });
        }
      },
      db: {
        schema: 'public'
      }
    });
    
    isAdminClientInitialized = true;
  }
  return adminClientInstance;
})();

// Helper function to check if admin client is properly configured
export const isAdminClientConfigured = () => {
  return !!supabaseServiceKey && supabaseServiceKey.length > 0;
}; 