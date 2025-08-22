-- Add postal_code field to leads table
-- This is a safe migration that only adds a new field without affecting existing data

-- Step 1: Add the new column
ALTER TABLE leads 
ADD COLUMN postal_code TEXT;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN leads.postal_code IS 'Postal code for the lead location';

-- Step 3: Create index for search functionality
CREATE INDEX IF NOT EXISTS idx_leads_postal_code ON leads (postal_code);

-- Step 4: Add to system settings for validation options (if needed)
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES (
  'postal_code_validation', 
  'true', 
  'Enable postal code validation for leads'
) ON CONFLICT (setting_key) DO NOTHING;

-- Step 5: Log the migration
DO $$
BEGIN
  INSERT INTO system_settings (setting_key, setting_value, description) 
  VALUES (
    'migration_log_postal_code', 
    '{"timestamp": "' || NOW() || '", "migration": "add_postal_code_to_leads", "status": "completed"}',
    'Migration log for adding postal_code field to leads table'
  );
  
  RAISE NOTICE 'Successfully added postal_code field to leads table';
END $$;
