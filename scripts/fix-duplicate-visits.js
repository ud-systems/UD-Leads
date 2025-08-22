const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function previewDuplicates() {
  console.log('🔍 Previewing duplicate visits...\n');
  
  try {
    // Read the preview SQL script
    const previewScript = fs.readFileSync(
      path.join(__dirname, 'preview_duplicate_visits.sql'), 
      'utf8'
    );
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: previewScript });
    
    if (error) {
      console.error('❌ Error previewing duplicates:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('📋 Duplicate visits found:');
      console.log('='.repeat(80));
      
      data.forEach((visit, index) => {
        console.log(`${index + 1}. Lead: ${visit.store_name || visit.lead_id}`);
        console.log(`   Date: ${visit.date} | Time: ${visit.time}`);
        console.log(`   Salesperson: ${visit.salesperson}`);
        console.log(`   Notes: ${visit.notes_preview}`);
        console.log(`   Created: ${visit.created_at}`);
        console.log(`   Rank: ${visit.visit_rank}`);
        console.log('');
      });
      
      return true;
    } else {
      console.log('✅ No duplicate visits found!');
      return false;
    }
  } catch (error) {
    console.error('❌ Error reading preview script:', error);
    return false;
  }
}

async function getDuplicateSummary() {
  try {
    const { data, error } = await supabase
      .from('visits')
      .select('lead_id, date, created_at')
      .not('lead_id', 'is', null);
    
    if (error) {
      console.error('❌ Error getting visit data:', error);
      return null;
    }
    
    // Group by lead_id and date, count duplicates
    const grouped = {};
    data.forEach(visit => {
      const key = `${visit.lead_id}-${visit.date}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(visit);
    });
    
    const duplicates = Object.values(grouped).filter(group => group.length > 1);
    
    return {
      totalLeads: new Set(data.map(v => v.lead_id)).size,
      leadsWithDuplicates: new Set(duplicates.map(group => group[0].lead_id)).size,
      totalDuplicates: duplicates.reduce((sum, group) => sum + (group.length - 1), 0),
      duplicateGroups: duplicates.length
    };
  } catch (error) {
    console.error('❌ Error calculating summary:', error);
    return null;
  }
}

async function runCleanup() {
  console.log('🧹 Running duplicate visits cleanup...\n');
  
  try {
    // Read the migration SQL script
    const migrationScript = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '20250118000001_fix_duplicate_visits.sql'), 
      'utf8'
    );
    
    // Split the script into individual statements
    const statements = migrationScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
          return false;
        }
      }
    }
    
    console.log('✅ Cleanup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error running cleanup:', error);
    return false;
  }
}

async function main() {
  console.log('🔄 Duplicate Visits Cleanup Tool\n');
  
  // Get summary first
  const summary = await getDuplicateSummary();
  if (summary) {
    console.log('📊 Current Database State:');
    console.log(`   Total leads with visits: ${summary.totalLeads}`);
    console.log(`   Leads with duplicates: ${summary.leadsWithDuplicates}`);
    console.log(`   Total duplicates to remove: ${summary.totalDuplicates}`);
    console.log(`   Duplicate groups: ${summary.duplicateGroups}\n`);
  }
  
  if (summary.totalDuplicates === 0) {
    console.log('✅ No duplicates found. Database is already clean!');
    return;
  }
  
  // Preview duplicates
  const hasDuplicates = await previewDuplicates();
  
  if (!hasDuplicates) {
    return;
  }
  
  console.log('⚠️  WARNING: This will permanently delete duplicate visits!');
  console.log('   Only the first visit for each lead-date combination will be kept.\n');
  
  // In a real scenario, you might want to add a confirmation prompt here
  // For now, we'll proceed with the cleanup
  
  const success = await runCleanup();
  
  if (success) {
    console.log('\n🎉 Cleanup completed! Your visit counts should now be accurate.');
    console.log('   Please refresh your dashboard to see the corrected metrics.');
  } else {
    console.log('\n❌ Cleanup failed. Please check the error messages above.');
  }
}

// Run the script
main().catch(console.error);
