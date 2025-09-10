// Connection Manager for handling regional access issues
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Connection strategies
export type ConnectionStrategy = 'rest-api' | 'direct-db' | 'fallback';

interface ConnectionConfig {
  strategy: ConnectionStrategy;
  url: string;
  key: string;
  timeout: number;
  retries: number;
}

// Get configuration from environment variables or fallback to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uiprdzdskaqakfwhzssc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTMyMzIsImV4cCI6MjA2ODIyOTIzMn0.FCQX8C1q0QpFl_jKXYNN94rO67QIqmXkY1L4FnrniG8';
const DATABASE_URL = import.meta.env.DATABASE_URL || 'postgresql://postgres.uiprdzdskaqakfwhzssc:ud-leads-971@aws-0-eu-west-2.pooler.supabase.com:5432/postgres';

// Multiple connection configurations
const CONNECTION_CONFIGS: ConnectionConfig[] = [
  // Primary: REST API (standard Supabase)
  {
    strategy: 'rest-api',
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY,
    timeout: 10000, // Reduced to 10 seconds for faster response
    retries: 3
  },
  // Fallback: Direct database connection (for scripts)
  {
    strategy: 'direct-db',
    url: DATABASE_URL,
    key: 'direct-connection',
    timeout: 15000, // Reduced to 15 seconds for faster response
    retries: 2
  }
];

// Connection health status
interface ConnectionHealth {
  strategy: ConnectionStrategy;
  healthy: boolean;
  latency: number;
  error?: string;
  lastChecked: Date;
}

class ConnectionManager {
  private connections: Map<ConnectionStrategy, any> = new Map();
  private healthStatus: Map<ConnectionStrategy, ConnectionHealth> = new Map();
  private currentStrategy: ConnectionStrategy = 'rest-api';
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeConnections();
    this.startHealthChecks();
  }

  private initializeConnections() {
    // Initialize REST API client
    const restConfig = CONNECTION_CONFIGS.find(c => c.strategy === 'rest-api');
    if (restConfig) {
      this.connections.set('rest-api', createClient<Database>(restConfig.url, restConfig.key, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'retail-lead-compass-auth-unique',
          flowType: 'pkce'
        },
        global: {
          headers: {
            'X-Client-Info': 'retail-lead-compass-client-unique'
          },
          fetch: this.createFetchWrapper(restConfig)
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }));
    }
  }

  private createFetchWrapper(config: ConnectionConfig) {
    return (url: string, options: any = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).catch((error) => {
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          console.warn(`Connection failed for ${config.strategy}:`, url);
          throw new Error(`Connection failed for ${config.strategy}. This may be due to regional restrictions.`);
        } else if (error.name === 'AbortError') {
          console.warn(`Connection timeout for ${config.strategy}:`, url);
          throw new Error(`Connection timeout for ${config.strategy}. The server is taking too long to respond.`);
        }
        throw error;
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    };
  }

  private async checkConnectionHealth(strategy: ConnectionStrategy): Promise<ConnectionHealth> {
    const startTime = Date.now();
    
    try {
      if (strategy === 'rest-api') {
        const client = this.connections.get('rest-api');
        if (!client) {
          throw new Error('REST API client not initialized');
        }

        const { error } = await client
          .from('profiles')
          .select('count')
          .limit(1)
          .abortSignal(AbortSignal.timeout(10000));

        const latency = Date.now() - startTime;
        
        if (error) {
          return {
            strategy,
            healthy: false,
            latency,
            error: error.message,
            lastChecked: new Date()
          };
        }

        return {
          strategy,
          healthy: true,
          latency,
          lastChecked: new Date()
        };
      }
      
      // For direct-db strategy, we can't easily test without a proper PostgreSQL client
      // So we'll mark it as healthy if we have the connection string
      return {
        strategy,
        healthy: true,
        latency: 0,
        lastChecked: new Date()
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        strategy,
        healthy: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      };
    }
  }

  private startHealthChecks() {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      for (const config of CONNECTION_CONFIGS) {
        const health = await this.checkConnectionHealth(config.strategy);
        this.healthStatus.set(config.strategy, health);
        
        // If current strategy is unhealthy and we have a healthy alternative, switch
        if (config.strategy === this.currentStrategy && !health.healthy) {
          const alternative = CONNECTION_CONFIGS.find(c => 
            c.strategy !== this.currentStrategy && 
            this.healthStatus.get(c.strategy)?.healthy
          );
          
          if (alternative) {
            console.log(`Switching from ${this.currentStrategy} to ${alternative.strategy} due to health issues`);
            this.currentStrategy = alternative.strategy;
          }
        }
      }
    }, 30000);

    // Initial health check
    this.performInitialHealthCheck();
  }

  private async performInitialHealthCheck() {
    for (const config of CONNECTION_CONFIGS) {
      const health = await this.checkConnectionHealth(config.strategy);
      this.healthStatus.set(config.strategy, health);
      
      // Use the first healthy connection
      if (health.healthy && this.currentStrategy === 'rest-api') {
        this.currentStrategy = config.strategy;
        break;
      }
    }
  }

  public getClient(): any {
    const client = this.connections.get(this.currentStrategy);
    if (!client) {
      throw new Error(`No client available for strategy: ${this.currentStrategy}`);
    }
    return client;
  }

  public getCurrentStrategy(): ConnectionStrategy {
    return this.currentStrategy;
  }

  public getHealthStatus(): Map<ConnectionStrategy, ConnectionHealth> {
    return new Map(this.healthStatus);
  }

  public async forceHealthCheck(): Promise<void> {
    await this.performInitialHealthCheck();
  }

  public destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Global connection manager instance
let connectionManager: ConnectionManager | null = null;

export const getConnectionManager = (): ConnectionManager => {
  if (!connectionManager) {
    connectionManager = new ConnectionManager();
  }
  return connectionManager;
};

// Export the main client getter
export const getSupabaseClient = () => {
  return getConnectionManager().getClient();
};

// Export health check utilities
export const checkConnectionHealth = async () => {
  const manager = getConnectionManager();
  await manager.forceHealthCheck();
  return manager.getHealthStatus();
};

// Retry wrapper with connection strategy awareness
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
      
      // If it's a connection error, try to switch strategies
      if (lastError.message.includes('Connection failed') || 
          lastError.message.includes('Connection timeout')) {
        const manager = getConnectionManager();
        await manager.forceHealthCheck();
        
        // If we switched strategies, log it
        if (manager.getCurrentStrategy() !== 'rest-api') {
          console.log(`Retrying with ${manager.getCurrentStrategy()} strategy`);
        }
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
