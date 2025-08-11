-- Update leads table schema with new fields
-- This migration renames buying_power to weekly_spend and adds new business fields

-- Step 1: Add new columns
ALTER TABLE leads 
ADD COLUMN current_supplier TEXT,
ADD COLUMN owns_shop_or_website TEXT,
ADD COLUMN number_of_stores TEXT;

-- Step 2: Rename buying_power to weekly_spend
ALTER TABLE leads RENAME COLUMN buying_power TO weekly_spend;

-- Step 3: Add comments to document the new fields
COMMENT ON COLUMN leads.weekly_spend IS 'Weekly spend range for the lead';
COMMENT ON COLUMN leads.current_supplier IS 'Current supplier information';
COMMENT ON COLUMN leads.owns_shop_or_website IS 'Whether the lead owns a shop or website (No, Yes, NA)';
COMMENT ON COLUMN leads.number_of_stores IS 'Number of stores the lead operates (1,2,3,4,5,6,7,8,9,10+)';

-- Step 4: Update system settings to rename buying_power_options to weekly_spend_options
-- and update the values to the new format
UPDATE system_settings 
SET 
  setting_key = 'weekly_spend_options',
  setting_value = '["Less than £1000", "£1000 - £3000", "£5000 - £9999", "£10,000+"]',
  description = 'Available weekly spend options for leads'
WHERE setting_key = 'buying_power_options';

-- Step 5: Add new system settings for the new fields
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('owns_shop_or_website_options', '["No", "Yes", "NA"]', 'Available options for shop/website ownership'),
('number_of_stores_options', '["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"]', 'Available options for number of stores');

-- Step 6: Create indexes for better query performance on new fields
CREATE INDEX idx_leads_weekly_spend ON leads (weekly_spend);
CREATE INDEX idx_leads_owns_shop_or_website ON leads (owns_shop_or_website);
CREATE INDEX idx_leads_number_of_stores ON leads (number_of_stores);
CREATE INDEX idx_leads_current_supplier ON leads USING GIN (to_tsvector('english', current_supplier));
