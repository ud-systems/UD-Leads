-- ============================================================================
-- COMPLETE ENUM REMOVAL - Force remove store_type enum constraint
-- ============================================================================
-- This script will definitely remove the enum constraint
-- Run in: https://supabase.com/dashboard/project/uiprdzdskaqakfwhzssc/editor
-- ============================================================================

-- Step 1: Check current column type
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'store_type';

-- Step 2: Force conversion to TEXT (even if already converted)
ALTER TABLE leads 
ALTER COLUMN store_type TYPE TEXT;

-- Step 3: Drop the enum type completely (if it exists)
DROP TYPE IF EXISTS store_type_enum CASCADE;

-- Step 4: Verify the change
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'store_type';

-- Step 5: Test insert with new store type
INSERT INTO leads (store_name, contact_person, phone_number, store_type, latitude, longitude)
VALUES ('TEST_ENUM_REMOVAL', 'Test User', '1234567890', 'Petrol Station Forecourt', 51.5074, -0.1278);

-- Step 6: Clean up test record
DELETE FROM leads WHERE store_name = 'TEST_ENUM_REMOVAL';

-- Final verification
SELECT 'Enum constraint successfully removed!' as status;
