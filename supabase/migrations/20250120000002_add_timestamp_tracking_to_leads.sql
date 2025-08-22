-- Add timestamp tracking fields to leads table
-- This migration is safe for live data - existing records will have NULL values for new fields

-- Step 1: Add timestamp tracking fields
ALTER TABLE leads
ADD COLUMN form_start_time TIMESTAMP,
ADD COLUMN form_submit_time TIMESTAMP,
ADD COLUMN form_duration_ms INTEGER;

-- Step 2: Add comments for documentation
COMMENT ON COLUMN leads.form_start_time IS 'When coordinates were first filled (auto or manual)';
COMMENT ON COLUMN leads.form_submit_time IS 'When form was successfully submitted';
COMMENT ON COLUMN leads.form_duration_ms IS 'Duration in milliseconds from coordinates to submit';

-- Step 3: Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_leads_form_start_time ON leads (form_start_time);
CREATE INDEX IF NOT EXISTS idx_leads_form_duration_ms ON leads (form_duration_ms);

-- Step 4: Add to system settings for validation options
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('timestamp_tracking_enabled', 'true', 'Enable timestamp tracking for lead creation duration')
ON CONFLICT (setting_key) DO NOTHING;

-- Step 5: Log the migration
DO $$
BEGIN
  INSERT INTO system_settings (setting_key, setting_value, description)
  VALUES (
    'migration_log_timestamp_tracking',
    '{"timestamp": "' || NOW() || '", "migration": "add_timestamp_tracking_to_leads", "status": "completed", "fields_added": ["form_start_time", "form_submit_time", "form_duration_ms"]}',
    'Migration log for adding timestamp tracking fields to leads table'
  );

  RAISE NOTICE 'Successfully added timestamp tracking fields to leads table';
END $$;
