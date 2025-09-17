#!/usr/bin/env node

/**
 * Database Import Script for Supabase
 * Imports exported data to your new Supabase project
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration - Update these with your NEW project details
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-new-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-new-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function importTableData(tableName, data) {
  try {
    console.log(`📊 Importing data for table: ${tableName} (${data.length} rows)`);
    
    if (data.length === 0) {
      console.log(`⏭️ Skipping ${tableName} - no data to import`);
      return { success: true, imported: 0 };
    }
    
    // Import data in batches to avoid timeout
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from(tableName)
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error importing batch for ${tableName}:`, error);
        return { success: false, error };
      }
      
      imported += batch.length;
      console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1}: ${batch.length} rows`);
    }
    
    console.log(`✅ Successfully imported ${imported} rows to ${tableName}`);
    return { success: true, imported };
  } catch (error) {
    console.error(`❌ Error importing data for ${tableName}:`, error);
    return { success: false, error };
  }
}

async function importSystemSettings(settings) {
  try {
    console.log(`⚙️ Importing system settings (${settings.length} settings)`);
    
    if (settings.length === 0) {
      console.log(`⏭️ No system settings to import`);
      return { success: true, imported: 0 };
    }
    
    const { error } = await supabase
      .from('system_settings')
      .insert(settings);
    
    if (error) {
      console.error(`❌ Error importing system settings:`, error);
      return { success: false, error };
    }
    
    console.log(`✅ Successfully imported ${settings.length} system settings`);
    return { success: true, imported: settings.length };
  } catch (error) {
    console.error(`❌ Error importing system settings:`, error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 Starting database import...\n');
  
  // Check if export file exists
  const exportDir = path.join(process.cwd(), 'database-export');
  if (!fs.existsSync(exportDir)) {
    console.error('❌ Database export directory not found!');
    console.log('Please run "npm run export-database" first to create the export files.');
    return;
  }
  
  // Find the latest export file
  const files = fs.readdirSync(exportDir).filter(file => file.endsWith('.json'));
  if (files.length === 0) {
    console.error('❌ No export files found in database-export directory!');
    return;
  }
  
  const latestFile = files.sort().pop();
  const exportFile = path.join(exportDir, latestFile);
  
  console.log(`📁 Using export file: ${latestFile}`);
  
  // Read export data
  const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
  
  console.log(`📅 Export date: ${exportData.exportDate}`);
  console.log(`🔗 Original URL: ${exportData.supabaseUrl}`);
  console.log(`🔗 Target URL: ${SUPABASE_URL}\n`);
  
  const results = {
    tables: {},
    systemSettings: null,
    totalImported: 0,
    errors: []
  };
  
  // Import each table
  for (const [tableName, tableData] of Object.entries(exportData.tables)) {
    if (tableData.data && tableData.data.data) {
      const result = await importTableData(tableName, tableData.data.data);
      results.tables[tableName] = result;
      
      if (result.success) {
        results.totalImported += result.imported;
      } else {
        results.errors.push(`${tableName}: ${result.error?.message || 'Unknown error'}`);
      }
    }
  }
  
  // Import system settings
  if (exportData.systemSettings) {
    const result = await importSystemSettings(exportData.systemSettings);
    results.systemSettings = result;
    
    if (result.success) {
      results.totalImported += result.imported;
    } else {
      results.errors.push(`System Settings: ${result.error?.message || 'Unknown error'}`);
    }
  }
  
  // Print summary
  console.log('\n📊 Import Summary:');
  console.log('==================');
  
  Object.entries(results.tables).forEach(([tableName, result]) => {
    if (result.success) {
      console.log(`✅ ${tableName}: ${result.imported} rows imported`);
    } else {
      console.log(`❌ ${tableName}: Failed to import`);
    }
  });
  
  if (results.systemSettings) {
    if (results.systemSettings.success) {
      console.log(`✅ System Settings: ${results.systemSettings.imported} settings imported`);
    } else {
      console.log(`❌ System Settings: Failed to import`);
    }
  }
  
  console.log(`\n📈 Total rows imported: ${results.totalImported}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (results.errors.length === 0) {
    console.log('\n🎉 Database import completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test your application: npm run dev');
    console.log('2. Verify data in Supabase dashboard');
    console.log('3. Update any hardcoded references if needed');
  } else {
    console.log('\n⚠️ Import completed with some errors. Please review and fix as needed.');
  }
}

// Run the import
main().catch(console.error);
