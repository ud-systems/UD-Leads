-- Check and create necessary tables for conversion rules system
-- This migration ensures all required tables and data exist

-- Step 1: Create lead_status_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS lead_status_history (
  id SERIAL PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),
  conversion_counted BOOLEAN DEFAULT false
);

-- Step 2: Create conversion_rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversion_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('initial', 'transition', 'both')),
  from_status TEXT, -- NULL for initial creation or "any" status, or specific status for transitions
  to_status TEXT NOT NULL, -- Target status that counts as conversion
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON lead_status_history (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_changed_at ON lead_status_history (changed_at);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_new_status ON lead_status_history (new_status);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_conversion_counted ON lead_status_history (conversion_counted);
CREATE INDEX IF NOT EXISTS idx_conversion_rules_active ON conversion_rules (is_active);
CREATE INDEX IF NOT EXISTS idx_conversion_rules_default ON conversion_rules (is_default);
CREATE INDEX IF NOT EXISTS idx_conversion_rules_type ON conversion_rules (rule_type);

-- Step 4: Ensure system_settings table exists and has required data (only add if not exists)
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('enhanced_conversion_rules_enabled', 'true', 'Enable enhanced conversion tracking with status changes'),
  ('conversion_tracking_method', 'status_transitions', 'Method used for conversion tracking: status_transitions'),
  ('auto_conversion_tracking', 'true', 'Automatically track conversions on status changes')
ON CONFLICT (setting_key) DO NOTHING;

-- Step 5: Insert default conversion rules if none exist (using your actual status values)
INSERT INTO conversion_rules (rule_name, rule_type, from_status, to_status, is_default) 
SELECT * FROM (VALUES
  ('Initial Active Registered', 'initial', NULL, 'Active - Registered', false),
  ('Initial Active Buyer', 'initial', NULL, 'Active - Buyer', false),
  ('Prospect to Active Registered', 'transition', 'New Prospect - Not Registered', 'Active - Registered', false),
  ('Prospect to Active Buyer', 'transition', 'New Prospect - Not Registered', 'Active - Buyer', false),
  ('Any to Active Buyer', 'transition', NULL, 'Active - Buyer', true)
) AS v(rule_name, rule_type, from_status, to_status, is_default)
WHERE NOT EXISTS (SELECT 1 FROM conversion_rules);

-- Step 6: Create constraint to ensure only one default rule
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_rules_single_default 
ON conversion_rules (is_default) 
WHERE is_default = true;
