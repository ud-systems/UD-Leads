// Fallback connection using alternative methods
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get configuration from environment variables or fallback to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uiprdzdskaqakfwhzssc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTMyMzIsImV4cCI6MjA2ODIyOTIzMn0.FCQX8C1q0QpFl_jKXYNN94rO67QIqmXkY1L4FnrniG8';

// Alternative connection methods
export const createFallbackClient = () => {
  // Method 1: Try with different headers
  const client1 = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'retail-lead-compass-fallback',
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'retail-lead-compass-fallback',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        fetch: (url, options = {}) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              ...options.headers,
              'X-Client-Info': 'retail-lead-compass-fallback',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            }
          }).catch((error) => {
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
              console.warn(`Fallback connection failed for: ${url}`);
              throw new Error(`Connection failed. This may be due to regional restrictions or network issues.`);
            } else if (error.name === 'AbortError') {
              console.warn(`Fallback connection timeout for: ${url}`);
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
          eventsPerSecond: 5
        }
      }
    }
  );

  return client1;
};

// Test the fallback connection
export const testFallbackConnection = async () => {
  try {
    const client = createFallbackClient();
    const { data, error } = await client
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Fallback connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Fallback connection test successful');
    return { success: true, client };
  } catch (error) {
    console.error('Fallback connection test error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
