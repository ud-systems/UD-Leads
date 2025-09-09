// Direct database connection that bypasses regional restrictions
import { createClient } from '@supabase/supabase-js';
import { createFallbackClient, testFallbackConnection } from './fallbackConnection';
import type { Database } from './types';

// Get configuration from environment variables or fallback to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uiprdzdskaqakfwhzssc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTMyMzIsImV4cCI6MjA2ODIyOTIzMn0.FCQX8C1q0QpFl_jKXYNN94rO67QIqmXkY1L4FnrniG8';

// Alternative Supabase URLs to try (in case of regional issues)
const ALTERNATIVE_URLS = [
  SUPABASE_URL,
  `${SUPABASE_URL}:443`,
  `https://api.supabase.com/v1/projects/uiprdzdskaqakfwhzssc`,
];

// Create a client that tries multiple connection methods
export const createResilientSupabaseClient = () => {
  let client: any = null;
  let workingUrl: string | null = null;

  // Try each URL until one works
  for (const url of ALTERNATIVE_URLS) {
    try {
      client = createClient<Database>(url, SUPABASE_ANON_KEY, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'retail-lead-compass-auth-resilient',
          flowType: 'pkce'
        },
        global: {
          headers: {
            'X-Client-Info': 'retail-lead-compass-resilient-client'
          },
          fetch: (url, options = {}) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            return fetch(url, {
              ...options,
              signal: controller.signal,
            }).catch((error) => {
              if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.warn(`Connection failed for URL: ${url}`);
                throw new Error(`Connection failed. This may be due to regional restrictions.`);
              } else if (error.name === 'AbortError') {
                console.warn(`Connection timeout for URL: ${url}`);
                throw new Error(`Connection timeout. The server is taking too long to respond.`);
              }
              throw error;
            }).finally(() => {
              clearTimeout(timeoutId);
            });
          }
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
      
      workingUrl = url;
      break;
    } catch (error) {
      console.warn(`Failed to create client with URL: ${url}`, error);
      continue;
    }
  }

  if (!client) {
    // Try fallback connection as last resort
    console.warn('⚠️ Standard URLs failed, trying fallback connection...');
    try {
      const fallbackClient = createFallbackClient();
      console.log('✅ Fallback connection successful');
      return fallbackClient;
    } catch (error) {
      console.error('❌ Fallback connection also failed:', error);
      throw new Error('Unable to create Supabase client with any connection method');
    }
  }

  console.log(`✅ Supabase client created successfully with URL: ${workingUrl}`);
  return client;
};

// Export the resilient client
export const supabase = createResilientSupabaseClient();

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    
    console.log('✅ Connection test successful');
    return true;
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
};
