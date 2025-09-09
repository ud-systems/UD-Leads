
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, withRetry } from '@/integrations/supabase/client';
import { logConnectionDiagnostics } from '@/utils/connectionDiagnostics';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  connectionHealthy: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    connectionHealthy: true,
  });

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        try {
          setAuthState(prev => ({
            ...prev,
            user: session?.user ?? null,
            session,
            loading: false,
            connectionHealthy: true,
          }));
        } catch (error) {
          console.error('Auth state change error:', error);
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              loading: false,
              connectionHealthy: false,
            }));
            // Run diagnostics on auth errors
            logConnectionDiagnostics();
          }
        }
      }
    );

    // Get initial session with retry logic
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await withRetry(
          () => supabase.auth.getSession(),
          3,
          1000
        );

        if (!mounted) return;

        if (error) {
          console.error('Initial session error:', error);
          setAuthState(prev => ({
            ...prev,
            loading: false,
            connectionHealthy: false,
          }));
          // Run diagnostics on initial session errors
          logConnectionDiagnostics();
        } else {
          setAuthState(prev => ({
            ...prev,
            user: session?.user ?? null,
            session,
            loading: false,
            connectionHealthy: true,
          }));
        }
      } catch (error) {
        console.error('Failed to initialize auth after retries:', error);
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            connectionHealthy: false,
          }));
          // Run diagnostics on initialization failures
          logConnectionDiagnostics();
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await withRetry(
        () => supabase.auth.signInWithPassword({
          email,
          password,
        }),
        2, // Only retry once for login
        1000
      );

      if (error) {
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Connection error. Please check your internet connection and try again.';
        }

        return { 
          error: { 
            ...error, 
            message: errorMessage 
          } 
        };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        error: { 
          message: 'Connection timeout. Please check your internet connection and try again.' 
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await withRetry(
        () => supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/`,
          },
        }),
        2,
        1000
      );

      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Connection error. Please check your internet connection and try again.';
        }

        return { 
          error: { 
            ...error, 
            message: errorMessage 
          } 
        };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        error: { 
          message: 'Connection timeout. Please check your internet connection and try again.' 
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await withRetry(
        () => supabase.auth.signOut(),
        2,
        1000
      );
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { 
        error: { 
          message: 'Failed to sign out. Please try again.' 
        } 
      };
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
}
