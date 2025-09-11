// Single Supabase client instance to prevent multiple GoTrueClient warnings
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uiprdzdskaqakfwhzssc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTMyMzIsImV4cCI6MjA2ODIyOTIzMn0.FCQX8C1q0QpFl_jKXYNN94rO67QIqmXkY1L4FnrniG8';

// Create a single, optimized Supabase client instance
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'retail-lead-compass-auth-main',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'retail-lead-compass-client'
    },
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced to 10 seconds
      
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

// Connection test function - optimized for speed
export const testConnection = async () => {
  try {
    // Use a simple health check instead of querying profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
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

// Retry wrapper for database operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on auth errors or validation errors
      if (lastError.message.includes('Invalid login credentials') || 
          lastError.message.includes('validation') ||
          lastError.message.includes('duplicate key')) {
        throw lastError;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
};

// Handle auth errors and clear invalid tokens
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    console.log('Auth state changed:', event);
  }
});

// Handle auth errors
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear any invalid tokens from localStorage
    try {
      localStorage.removeItem('retail-lead-compass-auth-main');
      console.log('Cleared invalid auth tokens');
    } catch (error) {
      console.warn('Failed to clear auth tokens:', error);
    }
  }
});

// Test connection on import (but don't block the app)
testConnection().then(success => {
  if (success) {
    console.log('✅ Supabase connection established successfully');
  } else {
    console.warn('⚠️ Supabase connection test failed, but client is still available');
  }
}).catch(error => {
  console.warn('⚠️ Connection test error:', error);
});