/**
 * Check what store types actually exist in the database
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uiprdzdskaqakfwhzssc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTMyMzIsImV4cCI6MjA2ODIyOTIzMn0.FCQX8C1q0QpFl_jKXYNN94rO67QIqmXkY1L4FnrniG8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('🔍 Checking database store types...\n');
  
  try {
    // 1. Check system_settings for store types
    console.log('1️⃣ Checking system_settings table:');
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('setting_key', 'store_type_options')
      .single();
    
    if (settingsError) {
      console.error('   ❌ Error:', settingsError.message);
    } else {
      console.log('   ✅ Found in system_settings:');
      const storeTypes = JSON.parse(settings.setting_value);
      storeTypes.forEach((type, index) => {
        console.log(`      ${index + 1}. ${type}`);
      });
    }
    
    // 2. Check actual leads table to see what store_type values exist
    console.log('\n2️⃣ Checking actual store_type values in leads table:');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('store_type')
      .not('store_type', 'is', null);
    
    if (leadsError) {
      console.error('   ❌ Error:', leadsError.message);
    } else {
      const uniqueTypes = [...new Set(leads.map(l => l.store_type))].sort();
      console.log('   ✅ Unique store types found in leads:');
      uniqueTypes.forEach((type, index) => {
        console.log(`      ${index + 1}. ${type}`);
      });
    }
    
    // 3. Try to create a test lead with "Petrol Station Forecourt"
    console.log('\n3️⃣ Testing if "Petrol Station Forecourt" is accepted:');
    const testLead = {
      store_name: 'TEST_ENUM_CHECK_DELETE_ME',
      contact_person: 'Test',
      phone_number: '1234567890',
      store_type: 'Petrol Station Forecourt',
      latitude: 51.5074,
      longitude: -0.1278
    };
    
    const { data: testData, error: testError } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single();
    
    if (testError) {
      console.error('   ❌ ENUM CONSTRAINT ERROR:', testError.message);
      console.log('\n   📋 This confirms "Petrol Station Forecourt" is NOT in the database enum.');
    } else {
      console.log('   ✅ "Petrol Station Forecourt" is ACCEPTED by the database!');
      console.log('   🧹 Cleaning up test record...');
      
      // Delete the test record
      await supabase
        .from('leads')
        .delete()
        .eq('id', testData.id);
      console.log('   ✅ Test record deleted.');
    }
    
    // 4. Try with "Mobile Phone Shop"
    console.log('\n4️⃣ Testing if "Mobile Phone Shop" is accepted:');
    const testLead2 = {
      store_name: 'TEST_ENUM_CHECK_DELETE_ME_2',
      contact_person: 'Test',
      phone_number: '1234567890',
      store_type: 'Mobile Phone Shop',
      latitude: 51.5074,
      longitude: -0.1278
    };
    
    const { data: testData2, error: testError2 } = await supabase
      .from('leads')
      .insert(testLead2)
      .select()
      .single();
    
    if (testError2) {
      console.error('   ❌ ENUM CONSTRAINT ERROR:', testError2.message);
      console.log('\n   📋 This confirms "Mobile Phone Shop" is NOT in the database enum.');
    } else {
      console.log('   ✅ "Mobile Phone Shop" is ACCEPTED by the database!');
      console.log('   🧹 Cleaning up test record...');
      
      // Delete the test record
      await supabase
        .from('leads')
        .delete()
        .eq('id', testData2.id);
      console.log('   ✅ Test record deleted.');
    }
    
    console.log('\n✅ Database assessment complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabase();

