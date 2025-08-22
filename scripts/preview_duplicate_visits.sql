-- Preview Duplicate Visits Script
-- Run this first to see what would be deleted before running the actual migration
-- This is a SAFE script that only shows what would be removed

-- Show duplicate visits that would be removed
WITH visit_rankings AS (
  SELECT 
    v.id,
    v.lead_id,
    l.store_name,
    v.date,
    v.time,
    v.status,
    v.salesperson,
    v.notes,
    v.created_at,
    v.manager_id,
    ROW_NUMBER() OVER (
      PARTITION BY v.lead_id, v.date 
      ORDER BY v.created_at ASC
    ) as visit_rank
  FROM visits v
  LEFT JOIN leads l ON v.lead_id = l.id
  WHERE v.lead_id IS NOT NULL
)
SELECT 
  id,
  lead_id,
  store_name,
  date,
  time,
  status,
  salesperson,
  LEFT(notes, 50) || CASE WHEN LENGTH(notes) > 50 THEN '...' ELSE '' END as notes_preview,
  created_at,
  visit_rank
FROM visit_rankings 
WHERE visit_rank > 1
ORDER BY lead_id, date, created_at;

-- Show summary statistics
WITH visit_rankings AS (
  SELECT 
    lead_id,
    date,
    ROW_NUMBER() OVER (
      PARTITION BY lead_id, date 
      ORDER BY created_at ASC
    ) as visit_rank
  FROM visits
  WHERE lead_id IS NOT NULL
),
duplicate_summary AS (
  SELECT 
    lead_id,
    date,
    COUNT(*) as total_visits,
    COUNT(*) - 1 as duplicates_to_remove
  FROM visit_rankings
  GROUP BY lead_id, date
  HAVING COUNT(*) > 1
)
SELECT 
  COUNT(DISTINCT lead_id) as leads_with_duplicates,
  COUNT(*) as duplicate_groups,
  SUM(duplicates_to_remove) as total_duplicates_to_remove
FROM duplicate_summary;
