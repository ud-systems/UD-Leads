// Connection diagnostics utility for troubleshooting regional access issues

export interface ConnectionDiagnostic {
  dnsResolution: boolean;
  networkConnectivity: boolean;
  supabaseAccess: boolean;
  region: string;
  recommendations: string[];
}

export const runConnectionDiagnostics = async (): Promise<ConnectionDiagnostic> => {
  const diagnostic: ConnectionDiagnostic = {
    dnsResolution: false,
    networkConnectivity: false,
    supabaseAccess: false,
    region: 'unknown',
    recommendations: []
  };

  try {
    // Test 1: Basic network connectivity
    try {
      const response = await fetch('https://httpbin.org/ip', { 
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) {
        const data = await response.json();
        diagnostic.networkConnectivity = true;
        diagnostic.region = data.origin || 'unknown';
      }
    } catch (error) {
      console.warn('Network connectivity test failed:', error);
    }

    // Test 2: DNS resolution for Supabase
    try {
      const response = await fetch('https://uiprdzdskaqakfwhzssc.supabase.co/rest/v1/', {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTMyMzIsImV4cCI6MjA2ODIyOTIzMn0.FCQX8C1q0QpFl_jKXYNN94rO67QIqmXkY1L4FnrniG8'
        }
      });
      
      if (response.status === 200 || response.status === 401) {
        diagnostic.dnsResolution = true;
        diagnostic.supabaseAccess = true;
      }
    } catch (error) {
      console.warn('Supabase access test failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          diagnostic.dnsResolution = false;
          diagnostic.recommendations.push('DNS resolution failed. Try using a VPN or different DNS server (8.8.8.8, 1.1.1.1)');
        } else if (error.message.includes('timeout')) {
          diagnostic.dnsResolution = true;
          diagnostic.recommendations.push('Connection timeout. Try using a VPN or check your firewall settings');
        }
      }
    }

    // Generate recommendations based on results
    if (!diagnostic.networkConnectivity) {
      diagnostic.recommendations.push('No internet connectivity detected. Check your network connection.');
    }

    if (!diagnostic.supabaseAccess && diagnostic.networkConnectivity) {
      diagnostic.recommendations.push('Supabase service may be blocked in your region. Try using a VPN with UK/US servers.');
      diagnostic.recommendations.push('Check if your organization blocks cloud services.');
    }

    if (diagnostic.region && !['GB', 'US', 'CA', 'AU', 'DE', 'FR'].includes(diagnostic.region.split(',')[0])) {
      diagnostic.recommendations.push('You appear to be in a region that may have restricted access to Supabase. Consider using a VPN.');
    }

  } catch (error) {
    console.error('Connection diagnostics failed:', error);
    diagnostic.recommendations.push('Unable to run diagnostics. Please check your internet connection.');
  }

  return diagnostic;
};

export const getConnectionStatusMessage = (diagnostic: ConnectionDiagnostic): string => {
  if (diagnostic.supabaseAccess) {
    return '✅ Connection to Supabase is working properly.';
  } else if (diagnostic.dnsResolution) {
    return '⚠️ DNS resolution works but Supabase access is blocked. Try using a VPN.';
  } else if (diagnostic.networkConnectivity) {
    return '⚠️ Internet connection works but DNS resolution failed. Try changing DNS servers.';
  } else {
    return '❌ No internet connectivity detected. Check your network connection.';
  }
};
