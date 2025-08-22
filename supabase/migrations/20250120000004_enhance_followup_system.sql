-- Enhance existing follow-up system in leads table
-- This approach is cleaner than creating a separate table since we already have data

-- Step 1: Add follow-up status and completion tracking fields
ALTER TABLE leads
ADD COLUMN followup_status TEXT DEFAULT 'pending' CHECK (followup_status IN ('pending', 'completed', 'cancelled')),
ADD COLUMN followup_completed_date TIMESTAMP,
ADD COLUMN followup_completed_time TIMESTAMP,
ADD COLUMN followup_notes TEXT;

-- Step 2: Add comments for documentation
COMMENT ON COLUMN leads.followup_status IS 'Status of the scheduled follow-up: pending, completed, or cancelled';
COMMENT ON COLUMN leads.followup_completed_date IS 'Date when the follow-up was completed';
COMMENT ON COLUMN leads.followup_completed_time IS 'Timestamp when the follow-up was completed';
COMMENT ON COLUMN leads.followup_notes IS 'Additional notes for the follow-up';

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_followup_status ON leads (followup_status);
CREATE INDEX IF NOT EXISTS idx_leads_followup_completed_date ON leads (followup_completed_date);
CREATE INDEX IF NOT EXISTS idx_leads_next_visit ON leads (next_visit);

-- Step 4: Add to system settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('enhanced_followup_system', 'true', 'Enable enhanced follow-up tracking system'),
  ('auto_convert_followups_to_visits', 'true', 'Automatically convert completed follow-ups to visits'),
  ('followup_status_tracking', 'true', 'Track follow-up status (pending, completed, cancelled)')
ON CONFLICT (setting_key) DO NOTHING;

-- Step 5: Log the migration
DO $$
BEGIN
  INSERT INTO system_settings (setting_key, setting_value, description)
  VALUES (
    'migration_log_enhance_followup_system',
    '{"timestamp": "' || NOW() || '", "migration": "enhance_followup_system", "status": "completed", "fields_added": ["followup_status", "followup_completed_date", "followup_completed_time", "followup_notes"]}',
    'Migration log for enhancing follow-up system in leads table'
  );

  RAISE NOTICE 'Successfully enhanced follow-up system in leads table';
END $$;
