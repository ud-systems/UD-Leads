/**
 * Script to remove store_type enum constraint and convert to TEXT
 * This enables truly dynamic store types
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://uiprdzdskaqakfwhzssc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTMyMzIsImV4cCI6MjA2ODIyOTIzMn0.FCQX8C1q0QpFl_jKXYNN94rO67QIqmXkY1L4FnrniG8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function removeMigration() {
  console.log('🔄 Starting migration: Remove store_type enum constraint...\n');
  
  const sql = `
-- Convert store_type from enum to TEXT
DO $$ 
BEGIN
    -- Check if the store_type column exists and uses enum
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'store_type'
        AND udt_name = 'store_type_enum'
    ) THEN
        -- Convert the column from enum to TEXT while preserving all data
        ALTER TABLE leads 
        ALTER COLUMN store_type TYPE TEXT 
        USING store_type::TEXT;
        
        RAISE NOTICE '✅ Converted store_type column from ENUM to TEXT';
    ELSE
        RAISE NOTICE 'ℹ️  store_type column is already TEXT or does not exist';
    END IF;
    
    -- Drop the enum type if it exists and is no longer used
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_type_enum') THEN
        -- Check if enum is still used by any other columns
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'store_type_enum'
        ) THEN
            DROP TYPE store_type_enum;
            RAISE NOTICE '✅ Dropped unused store_type_enum type';
        ELSE
            RAISE NOTICE '⚠️  store_type_enum is still in use by other columns, keeping it';
        END IF;
    END IF;
    
END $$;
`;
  
  console.log('📋 This migration will:');
  console.log('   1. Convert store_type column from ENUM to TEXT');
  console.log('   2. Preserve all existing data');
  console.log('   3. Remove the enum constraint');
  console.log('   4. Allow any store type value going forward\n');
  
  console.log('⚠️  NOTE: This script needs to run SQL directly on the database.');
  console.log('   Please run the SQL manually in Supabase SQL Editor.\n');
  
  console.log('🔗 Go to: https://supabase.com/dashboard/project/uiprdzdskaqakfwhzssc/editor');
  console.log('   Click "SQL Editor" and paste the SQL below:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(sql);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n✅ After running the SQL, test by creating a lead with:');
  console.log('   - Petrol Station Forecourt');
  console.log('   - Mobile Phone Shop');
  console.log('   - Any new store type you add in Settings\n');
}

removeMigration();

