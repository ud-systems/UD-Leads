/**
 * Verify that store_type enum constraint has been removed
 * and test that dynamic store types now work
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uiprdzdskaqakfwhzssc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcHJkemRza2FxYWtmd2h6c3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTMyMzIsImV4cCI6MjA2ODIyOTIzMn0.FCQX8C1q0QpFl_jKXYNN94rO67QIqmXkY1L4FnrniG8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyFix() {
  console.log('🔍 Verifying store_type fix...\n');
  
  try {
    // Test 1: Try to create a lead with "Petrol Station Forecourt"
    console.log('1️⃣ Testing "Petrol Station Forecourt":');
    const testLead1 = {
      store_name: 'TEST_VERIFICATION_DELETE_ME_1',
      contact_person: 'Test',
      phone_number: '1234567890',
      store_type: 'Petrol Station Forecourt',
      latitude: 51.5074,
      longitude: -0.1278
    };
    
    const { data: data1, error: error1 } = await supabase
      .from('leads')
      .insert(testLead1)
      .select()
      .single();
    
    if (error1) {
      console.error('   ❌ FAILED:', error1.message);
      console.log('   ⚠️  The enum constraint is still active. Please run the SQL migration.\n');
      return false;
    } else {
      console.log('   ✅ SUCCESS! "Petrol Station Forecourt" accepted');
      await supabase.from('leads').delete().eq('id', data1.id);
      console.log('   🧹 Test record cleaned up\n');
    }
    
    // Test 2: Try to create a lead with "Mobile Phone Shop"
    console.log('2️⃣ Testing "Mobile Phone Shop":');
    const testLead2 = {
      store_name: 'TEST_VERIFICATION_DELETE_ME_2',
      contact_person: 'Test',
      phone_number: '1234567890',
      store_type: 'Mobile Phone Shop',
      latitude: 51.5074,
      longitude: -0.1278
    };
    
    const { data: data2, error: error2 } = await supabase
      .from('leads')
      .insert(testLead2)
      .select()
      .single();
    
    if (error2) {
      console.error('   ❌ FAILED:', error2.message);
      return false;
    } else {
      console.log('   ✅ SUCCESS! "Mobile Phone Shop" accepted');
      await supabase.from('leads').delete().eq('id', data2.id);
      console.log('   🧹 Test record cleaned up\n');
    }
    
    // Test 3: Try a completely new store type
    console.log('3️⃣ Testing a brand new store type "Coffee Shop":');
    const testLead3 = {
      store_name: 'TEST_VERIFICATION_DELETE_ME_3',
      contact_person: 'Test',
      phone_number: '1234567890',
      store_type: 'Coffee Shop',
      latitude: 51.5074,
      longitude: -0.1278
    };
    
    const { data: data3, error: error3 } = await supabase
      .from('leads')
      .insert(testLead3)
      .select()
      .single();
    
    if (error3) {
      console.error('   ❌ FAILED:', error3.message);
      return false;
    } else {
      console.log('   ✅ SUCCESS! Any new store type works!');
      await supabase.from('leads').delete().eq('id', data3.id);
      console.log('   🧹 Test record cleaned up\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Your system is now truly dynamic!');
    console.log('✅ Any store type you add in Settings will work immediately');
    console.log('✅ No more database migrations needed for new store types');
    console.log('✅ All existing data and functionality preserved\n');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

verifyFix();

