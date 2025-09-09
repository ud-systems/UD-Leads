import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = "https://uiprdzdskaqakfwhzssc.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY1MzIzMiwiZXhwIjoyMDY4MjI5MjMyfQ.bzQCRiKu7eayFZNVsCZn8vb4ngUt9prl5jDxUPJHQaE";

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
        // Add fetch configuration with timeout and DNS fallback for admin operations
        fetch: (url, options = {}) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for admin operations
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).catch((error) => {
            // Handle DNS resolution errors
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
              console.error('DNS resolution failed for Supabase admin URL:', url);
              throw new Error('Unable to connect to the admin server. Please check your internet connection or try using a VPN if you\'re in a restricted region.');
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