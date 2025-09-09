// Database operations using direct connection for scripts
import { Client } from 'pg';
import { TablesInsert } from '@/integrations/supabase/types';

// Direct database connection configuration
const DB_CONFIG = {
  host: 'aws-0-eu-west-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.uiprdzdskaqakfwhzssc',
  password: 'ud-leads-971',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000,
  query_timeout: 30000
};

class DatabaseOperations {
  private client: Client | null = null;

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    this.client = new Client(DB_CONFIG);
    await this.client.connect();
    console.log('Connected to database via direct connection');
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
      console.log('Disconnected from database');
    }
  }

  async insertTerritories(territories: TablesInsert<'territories'>[]): Promise<void> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < territories.length; i += batchSize) {
      batches.push(territories.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const values = batch.map((_, index) => {
        return `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`;
      }).join(', ');

      const query = `
        INSERT INTO territories (city, country, status)
        VALUES ${values}
        ON CONFLICT (city) DO NOTHING
      `;

      const params = batch.flatMap(territory => [
        territory.city,
        territory.country,
        territory.status
      ]);

      try {
        await this.client.query(query, params);
        console.log(`✅ Inserted batch ${i + 1}/${batches.length} (${batch.length} territories)`);
      } catch (error) {
        console.error(`❌ Error inserting batch ${i + 1}:`, error);
        throw error;
      }
    }
  }

  async getTerritoryCount(): Promise<number> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const result = await this.client.query('SELECT COUNT(*) as count FROM territories');
    return parseInt(result.rows[0].count);
  }

  async checkConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        await this.connect();
      }
      
      const result = await this.client!.query('SELECT 1 as test');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dbOps = new DatabaseOperations();

// Helper function to run database operations
export const runDatabaseOperation = async <T>(
  operation: (dbOps: DatabaseOperations) => Promise<T>
): Promise<T> => {
  try {
    await dbOps.connect();
    return await operation(dbOps);
  } finally {
    await dbOps.disconnect();
  }
};
