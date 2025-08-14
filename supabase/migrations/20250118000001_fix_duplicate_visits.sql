-- Fix Duplicate Visits Migration
-- This migration identifies and removes duplicate visits that were created before the fix
-- It keeps the first visit for each lead and removes subsequent duplicates

-- Step 1: Create a temporary table to identify duplicate visits
CREATE TEMP TABLE duplicate_visits AS
WITH visit_rankings AS (
  SELECT 
    id,
    lead_id,
    date,
    time,
    status,
    salesperson,
    notes,
    created_at,
    manager_id,
    ROW_NUMBER() OVER (
      PARTITION BY lead_id, date 
      ORDER BY created_at ASC
    ) as visit_rank
  FROM visits
  WHERE lead_id IS NOT NULL
)
SELECT 
  id,
  lead_id,
  date,
  visit_rank
FROM visit_rankings 
WHERE visit_rank > 1;

-- Step 2: Log the duplicates found (for audit purposes)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count FROM duplicate_visits;
  
  -- Insert audit log
  INSERT INTO system_settings (setting_key, setting_value, description) 
  VALUES (
    'duplicate_visits_cleanup_log', 
    '{"timestamp": "' || NOW() || '", "duplicates_found": ' || duplicate_count || '}',
    'Audit log for duplicate visits cleanup migration'
  );
  
  RAISE NOTICE 'Found % duplicate visits to be removed', duplicate_count;
END $$;

-- Step 3: Remove duplicate visits (keeping the first one for each lead-date combination)
DELETE FROM visits 
WHERE id IN (SELECT id FROM duplicate_visits);

-- Step 4: Create an index to prevent future duplicates
CREATE INDEX IF NOT EXISTS idx_visits_lead_date_unique 
ON visits (lead_id, date) 
WHERE lead_id IS NOT NULL;

-- Step 5: Add a comment to document this migration
COMMENT ON TABLE visits IS 'Visits table - duplicate prevention index added on lead_id + date';

-- Step 6: Log the completion
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count FROM visits WHERE lead_id IS NOT NULL;
  
  -- Update audit log
  UPDATE system_settings 
  SET setting_value = setting_value::jsonb || 
    '{"completion_timestamp": "' || NOW() || '", "remaining_visits": ' || remaining_count || '}'::jsonb
  WHERE setting_key = 'duplicate_visits_cleanup_log';
  
  RAISE NOTICE 'Migration completed. Remaining visits: %', remaining_count;
END $$;
