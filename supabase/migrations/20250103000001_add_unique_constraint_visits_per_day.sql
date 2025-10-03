-- Add unique constraint to prevent multiple visits per lead per day
-- This ensures only one visit can be recorded per lead per day

-- First, let's check if there are any existing duplicate visits that need to be cleaned up
WITH duplicate_visits AS (
  SELECT 
    lead_id,
    date,
    COUNT(*) as visit_count,
    MIN(created_at) as first_visit,
    MAX(created_at) as last_visit
  FROM visits 
  WHERE lead_id IS NOT NULL
  GROUP BY lead_id, date
  HAVING COUNT(*) > 1
)
SELECT 
  'Found ' || COUNT(*) || ' duplicate visit groups that need cleanup' as status
FROM duplicate_visits;

-- Clean up any existing duplicates (keep the first visit for each lead-date combination)
DELETE FROM visits 
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY lead_id, date 
        ORDER BY created_at ASC
      ) as visit_rank
    FROM visits
    WHERE lead_id IS NOT NULL
  ) ranked_visits
  WHERE visit_rank > 1
);

-- Add the unique constraint
ALTER TABLE visits 
ADD CONSTRAINT unique_lead_date_visit 
UNIQUE (lead_id, date);

-- Verify the constraint was added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  confrelid::regclass as table_name
FROM pg_constraint 
WHERE conname = 'unique_lead_date_visit';
