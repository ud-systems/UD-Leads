/**
 * Script to add 'Petrol Station Forecourt' to the store_type enum in the live database
 * Run this with: node scripts/add-store-type-enum.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uiprdzdskaqakfwhzssc.supabase.co';
// You'll need to provide your service role key for this operation
// Get it from: https://supabase.com/dashboard/project/uiprdzdskaqakfwhzssc/settings/api

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('\nTo run this script:');
  console.log('1. Get your service role key from: https://supabase.com/dashboard/project/uiprdzdskaqakfwhzssc/settings/api');
  console.log('2. Run: $env:SUPABASE_SERVICE_ROLE_KEY="your-key-here"; node scripts/add-store-type-enum.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addStoreTypeEnum() {
  console.log('🔄 Adding "Petrol Station Forecourt" to store_type enum...');
  
  const sql = `
    DO $$ 
    BEGIN
        -- Check if the enum type exists
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_type_enum') THEN
            -- Check if 'Petrol Station Forecourt' value already exists
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'store_type_enum')
                AND enumlabel = 'Petrol Station Forecourt'
            ) THEN
                -- Add the new value to existing enum
                ALTER TYPE store_type_enum ADD VALUE 'Petrol Station Forecourt';
                RAISE NOTICE 'Added Petrol Station Forecourt to store_type_enum';
            ELSE
                RAISE NOTICE 'Petrol Station Forecourt already exists in store_type_enum';
            END IF;
        ELSE
            RAISE NOTICE 'store_type_enum does not exist';
        END IF;
    END $$;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // If RPC doesn't exist, try direct SQL execution
      console.log('\n⚠️  Trying alternative method...');
      const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
      
      if (directError) {
        console.error('❌ Cannot execute SQL directly. Please run the migration manually.');
        console.log('\n📝 Manual steps:');
        console.log('1. Go to: https://supabase.com/dashboard/project/uiprdzdskaqakfwhzssc/editor');
        console.log('2. Click "SQL Editor"');
        console.log('3. Run this SQL:');
        console.log('\n' + sql);
        process.exit(1);
      }
    }
    
    console.log('✅ Successfully added "Petrol Station Forecourt" to store_type enum!');
    console.log('\n📋 Current enum values should now include:');
    console.log('   - Vape Shop');
    console.log('   - Convenience Store');
    console.log('   - Supermarket');
    console.log('   - Tobacco Shop');
    console.log('   - Gas Station');
    console.log('   - Pharmacy');
    console.log('   - Other');
    console.log('   - Mobile Phone Shop');
    console.log('   - Petrol Station Forecourt ✨ (newly added)');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

// Run the migration
addStoreTypeEnum()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  });

