-- Simple Duplicate Visits Cleanup Script
-- Run this directly in your Supabase SQL Editor to fix duplicate visits

-- Step 1: Show what duplicates exist (SAFE - READ ONLY)
WITH duplicate_analysis AS (
  SELECT 
    lead_id,
    date,
    COUNT(*) as visit_count,
    MIN(created_at) as first_visit_time,
    MAX(created_at) as last_visit_time
  FROM visits 
  WHERE lead_id IS NOT NULL
  GROUP BY lead_id, date
  HAVING COUNT(*) > 1
)
SELECT 
  'DUPLICATE ANALYSIS' as info,
  COUNT(*) as total_duplicate_groups,
  SUM(visit_count - 1) as total_duplicates_to_remove
FROM duplicate_analysis;

-- Step 2: Show specific duplicates that will be removed
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
    ROW_NUMBER() OVER (
      PARTITION BY v.lead_id, v.date 
      ORDER BY v.created_at ASC
    ) as visit_rank
  FROM visits v
  LEFT JOIN leads l ON v.lead_id = l.id
  WHERE v.lead_id IS NOT NULL
)
SELECT 
  'DUPLICATES TO REMOVE' as info,
  id,
  lead_id,
  store_name,
  date,
  time,
  salesperson,
  LEFT(notes, 30) || CASE WHEN LENGTH(notes) > 30 THEN '...' ELSE '' END as notes_preview,
  created_at,
  visit_rank
FROM visit_rankings 
WHERE visit_rank > 1
ORDER BY lead_id, date, created_at;

-- Step 3: ACTUAL CLEANUP (UNCOMMENT TO RUN)
-- WARNING: This will permanently delete duplicate visits!

/*
-- Delete duplicate visits (keeping the first one for each lead-date combination)
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

-- Verify cleanup
SELECT 
  'CLEANUP VERIFICATION' as info,
  COUNT(*) as remaining_visits,
  COUNT(DISTINCT lead_id) as unique_leads_with_visits
FROM visits 
WHERE lead_id IS NOT NULL;
*/
