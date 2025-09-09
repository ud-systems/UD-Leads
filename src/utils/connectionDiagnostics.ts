// Connection diagnostics utility for debugging Supabase connection issues
import { supabase } from '@/integrations/supabase/client';

export interface ConnectionDiagnostics {
  timestamp: Date;
  url: string;
  networkStatus: 'online' | 'offline';
  supabaseReachable: boolean;
  authServiceReachable: boolean;
  databaseReachable: boolean;
  errors: string[];
  recommendations: string[];
}

export const runConnectionDiagnostics = async (): Promise<ConnectionDiagnostics> => {
  const diagnostics: ConnectionDiagnostics = {
    timestamp: new Date(),
    url: import.meta.env.VITE_SUPABASE_URL || 'https://uiprdzdskaqakfwhzssc.supabase.co',
    networkStatus: navigator.onLine ? 'online' : 'offline',
    supabaseReachable: false,
    authServiceReachable: false,
    databaseReachable: false,
    errors: [],
    recommendations: []
  };

  // Test 1: Basic network connectivity
  if (!navigator.onLine) {
    diagnostics.errors.push('No internet connection detected');
    diagnostics.recommendations.push('Check your internet connection');
    return diagnostics;
  }

  // Test 2: Supabase URL reachability
  try {
    const response = await fetch(diagnostics.url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    diagnostics.supabaseReachable = true;
  } catch (error) {
    diagnostics.errors.push(`Supabase URL not reachable: ${error}`);
    diagnostics.recommendations.push('Check if Supabase service is down or URL is correct');
  }

  // Test 3: Auth service
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      diagnostics.errors.push(`Auth service error: ${error.message}`);
    } else {
      diagnostics.authServiceReachable = true;
    }
  } catch (error) {
    diagnostics.errors.push(`Auth service unreachable: ${error}`);
    diagnostics.recommendations.push('Check authentication service connectivity');
  }

  // Test 4: Database connectivity
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      diagnostics.errors.push(`Database error: ${error.message}`);
      if (error.message.includes('JWT')) {
        diagnostics.recommendations.push('Check Supabase API key configuration');
      } else if (error.message.includes('permission')) {
        diagnostics.recommendations.push('Check database permissions and RLS policies');
      }
    } else {
      diagnostics.databaseReachable = true;
    }
  } catch (error) {
    diagnostics.errors.push(`Database unreachable: ${error}`);
    diagnostics.recommendations.push('Check database connectivity and configuration');
  }

  // Generate recommendations based on results
  if (!diagnostics.supabaseReachable) {
    diagnostics.recommendations.push('Try using a VPN or different network');
    diagnostics.recommendations.push('Check firewall settings');
  }

  if (diagnostics.errors.length === 0) {
    diagnostics.recommendations.push('All connection tests passed - the issue may be intermittent');
  }

  return diagnostics;
};

export const logConnectionDiagnostics = async () => {
  console.group('🔍 Supabase Connection Diagnostics');
  const diagnostics = await runConnectionDiagnostics();
  
  console.log('📊 Diagnostics Results:', {
    timestamp: diagnostics.timestamp.toISOString(),
    networkStatus: diagnostics.networkStatus,
    supabaseReachable: diagnostics.supabaseReachable,
    authServiceReachable: diagnostics.authServiceReachable,
    databaseReachable: diagnostics.databaseReachable
  });

  if (diagnostics.errors.length > 0) {
    console.group('❌ Errors:');
    diagnostics.errors.forEach(error => console.error(error));
    console.groupEnd();
  }

  if (diagnostics.recommendations.length > 0) {
    console.group('💡 Recommendations:');
    diagnostics.recommendations.forEach(rec => console.log(`• ${rec}`));
    console.groupEnd();
  }

  console.groupEnd();
  return diagnostics;
};