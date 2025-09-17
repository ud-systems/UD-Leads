#!/usr/bin/env node

/**
 * Database Export Script for Supabase
 * Exports schema and data from your current Supabase project
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration - Update these with your current project details
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://uiprdzdskaqakfwhzssc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY1MzIzMiwiZXhwIjoyMDY4MjI5MjMyfQ.bzQCRiKu7eayFZNVsCZn8vb4ngUt9prl5jDxUPJHQaE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Tables to export (add more as needed)
const TABLES_TO_EXPORT = [
  'profiles',
  'leads',
  'visits',
  'territories',
  'user_preferences',
  'system_settings',
  'status_colors',
  'conversion_rules',
  'company_logos',
  'suppliers'
];

async function exportTableSchema(tableName) {
  try {
    console.log(`📋 Exporting schema for table: ${tableName}`);
    
    // Get table schema information
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', tableName)
      .eq('table_schema', 'public');
    
    if (error) {
      console.error(`❌ Error getting schema for ${tableName}:`, error);
      return null;
    }
    
    return {
      tableName,
      columns: data,
      schema: data.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default,
        maxLength: col.character_maximum_length
      }))
    };
  } catch (error) {
    console.error(`❌ Error exporting schema for ${tableName}:`, error);
    return null;
  }
}

async function exportTableData(tableName) {
  try {
    console.log(`📊 Exporting data for table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error getting data for ${tableName}:`, error);
      return null;
    }
    
    return {
      tableName,
      rowCount: data.length,
      data: data
    };
  } catch (error) {
    console.error(`❌ Error exporting data for ${tableName}:`, error);
    return null;
  }
}

async function exportSystemSettings() {
  try {
    console.log('⚙️ Exporting system settings...');
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');
    
    if (error) {
      console.error('❌ Error getting system settings:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error exporting system settings:', error);
    return null;
  }
}

async function generateSQLInsertStatements(tableData) {
  if (!tableData || !tableData.data || tableData.data.length === 0) {
    return `-- No data found for table: ${tableData?.tableName || 'unknown'}\n`;
  }
  
  const tableName = tableData.tableName;
  const columns = Object.keys(tableData.data[0]);
  
  let sql = `-- Data for table: ${tableName}\n`;
  sql += `-- Total rows: ${tableData.rowCount}\n\n`;
  
  // Generate INSERT statements
  tableData.data.forEach((row, index) => {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      return value;
    });
    
    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  });
  
  sql += '\n';
  return sql;
}

async function main() {
  console.log('🚀 Starting database export...\n');
  
  const exportData = {
    exportDate: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    tables: {},
    systemSettings: null,
    sqlStatements: ''
  };
  
  // Export each table
  for (const tableName of TABLES_TO_EXPORT) {
    console.log(`\n📦 Processing table: ${tableName}`);
    
    // Export schema
    const schema = await exportTableSchema(tableName);
    if (schema) {
      exportData.tables[tableName] = { schema };
    }
    
    // Export data
    const data = await exportTableData(tableName);
    if (data) {
      exportData.tables[tableName].data = data;
      
      // Generate SQL statements
      const sqlStatements = await generateSQLInsertStatements(data);
      exportData.sqlStatements += sqlStatements;
    }
  }
  
  // Export system settings
  const systemSettings = await exportSystemSettings();
  if (systemSettings) {
    exportData.systemSettings = systemSettings;
  }
  
  // Create export directory
  const exportDir = path.join(process.cwd(), 'database-export');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  // Save JSON export
  const jsonFile = path.join(exportDir, `database-export-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(exportData, null, 2));
  console.log(`\n✅ JSON export saved to: ${jsonFile}`);
  
  // Save SQL export
  const sqlFile = path.join(exportDir, `database-export-${new Date().toISOString().split('T')[0]}.sql`);
  let sqlContent = `-- Database Export for Supabase Project\n`;
  sqlContent += `-- Export Date: ${new Date().toISOString()}\n`;
  sqlContent += `-- Supabase URL: ${SUPABASE_URL}\n\n`;
  
  // Add table creation statements (simplified)
  Object.entries(exportData.tables).forEach(([tableName, tableInfo]) => {
    if (tableInfo.schema) {
      sqlContent += `-- Table: ${tableName}\n`;
      sqlContent += `-- Columns: ${tableInfo.schema.columns.map(c => `${c.name} (${c.type})`).join(', ')}\n\n`;
    }
  });
  
  sqlContent += exportData.sqlStatements;
  
  fs.writeFileSync(sqlFile, sqlContent);
  console.log(`✅ SQL export saved to: ${sqlFile}`);
  
  // Save summary
  const summaryFile = path.join(exportDir, `export-summary-${new Date().toISOString().split('T')[0]}.txt`);
  let summary = `Database Export Summary\n`;
  summary += `========================\n\n`;
  summary += `Export Date: ${new Date().toISOString()}\n`;
  summary += `Supabase URL: ${SUPABASE_URL}\n\n`;
  summary += `Tables Exported:\n`;
  
  Object.entries(exportData.tables).forEach(([tableName, tableInfo]) => {
    const rowCount = tableInfo.data?.rowCount || 0;
    summary += `- ${tableName}: ${rowCount} rows\n`;
  });
  
  summary += `\nSystem Settings: ${exportData.systemSettings ? exportData.systemSettings.length : 0} settings\n`;
  summary += `\nFiles Generated:\n`;
  summary += `- ${path.basename(jsonFile)} (Complete data export)\n`;
  summary += `- ${path.basename(sqlFile)} (SQL statements)\n`;
  summary += `- ${path.basename(summaryFile)} (This summary)\n`;
  
  fs.writeFileSync(summaryFile, summary);
  console.log(`✅ Summary saved to: ${summaryFile}`);
  
  console.log('\n🎉 Database export completed successfully!');
  console.log(`📁 All files saved to: ${exportDir}`);
}

// Run the export
main().catch(console.error);
