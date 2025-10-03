-- Enhance visits table with photo uploads, duration tracking, and location validation
-- Migration: enhance_visits_with_photos_and_duration

-- Add new columns to visits table for enhanced functionality
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS exterior_photos TEXT[],
ADD COLUMN IF NOT EXISTS interior_photos TEXT[],
ADD COLUMN IF NOT EXISTS visit_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS visit_end_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS visit_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS visit_number INTEGER,
ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visit_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS visit_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS location_accuracy_meters DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS visit_type VARCHAR(20) DEFAULT 'revisit';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visits_lead_id_visit_number ON visits(lead_id, visit_number);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits(date);
CREATE INDEX IF NOT EXISTS idx_visits_location_validated ON visits(location_validated);
CREATE INDEX IF NOT EXISTS idx_visits_visit_type ON visits(visit_type);

-- Add lead lifecycle tracking columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS first_visit_date DATE,
ADD COLUMN IF NOT EXISTS last_visit_date DATE,
ADD COLUMN IF NOT EXISTS total_visit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_age_days INTEGER,
ADD COLUMN IF NOT EXISTS conversion_date DATE,
ADD COLUMN IF NOT EXISTS lead_status_updated_at TIMESTAMP;

-- Create function to calculate visit numbers for each lead
CREATE OR REPLACE FUNCTION calculate_visit_numbers()
RETURNS void AS $$
BEGIN
  UPDATE visits 
  SET visit_number = subquery.row_number
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY lead_id 
        ORDER BY date ASC, time ASC, created_at ASC
      ) as row_number
    FROM visits
    WHERE visit_number IS NULL
  ) AS subquery
  WHERE visits.id = subquery.id;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to set visit numbers for existing visits
SELECT calculate_visit_numbers();

-- Create function to update lead visit statistics
CREATE OR REPLACE FUNCTION update_lead_visit_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update lead's visit statistics
  UPDATE leads SET
    total_visit_count = (
      SELECT COUNT(*) FROM visits 
      WHERE lead_id = NEW.lead_id AND status = 'completed'
    ),
    first_visit_date = (
      SELECT MIN(date) FROM visits 
      WHERE lead_id = NEW.lead_id AND status = 'completed'
    ),
    last_visit_date = (
      SELECT MAX(date) FROM visits 
      WHERE lead_id = NEW.lead_id AND status = 'completed'
    ),
    lead_age_days = (
      SELECT EXTRACT(days FROM (NOW() - created_at))::INTEGER
    ),
    updated_at = NOW()
  WHERE id = NEW.lead_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update lead stats when visits are added/updated
DROP TRIGGER IF EXISTS update_lead_stats_on_visit ON visits;
CREATE TRIGGER update_lead_stats_on_visit
  AFTER INSERT OR UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_visit_stats();

-- Create function to automatically set visit numbers for new visits
CREATE OR REPLACE FUNCTION set_visit_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set visit_number if it's not already set
  IF NEW.visit_number IS NULL THEN
    NEW.visit_number = (
      SELECT COALESCE(MAX(visit_number), 0) + 1
      FROM visits 
      WHERE lead_id = NEW.lead_id
    );
  END IF;
  
  -- Set visit_type based on visit_number
  IF NEW.visit_number = 1 THEN
    NEW.visit_type = 'initial';
  ELSE
    NEW.visit_type = 'revisit';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set visit numbers for new visits
DROP TRIGGER IF EXISTS set_visit_number_trigger ON visits;
CREATE TRIGGER set_visit_number_trigger
  BEFORE INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION set_visit_number();

-- Create function to calculate visit duration
CREATE OR REPLACE FUNCTION calculate_visit_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate duration if both start and end times are provided
  IF NEW.visit_start_time IS NOT NULL AND NEW.visit_end_time IS NOT NULL THEN
    NEW.visit_duration_minutes = EXTRACT(EPOCH FROM (NEW.visit_end_time - NEW.visit_start_time)) / 60;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate visit duration
DROP TRIGGER IF EXISTS calculate_visit_duration_trigger ON visits;
CREATE TRIGGER calculate_visit_duration_trigger
  BEFORE INSERT OR UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION calculate_visit_duration();

-- Create function to update photo count
CREATE OR REPLACE FUNCTION update_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total photo count
  NEW.photo_count = COALESCE(array_length(NEW.exterior_photos, 1), 0) + 
                   COALESCE(array_length(NEW.interior_photos, 1), 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update photo count
DROP TRIGGER IF EXISTS update_photo_count_trigger ON visits;
CREATE TRIGGER update_photo_count_trigger
  BEFORE INSERT OR UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_count();

-- Update existing leads with visit statistics
UPDATE leads SET
  total_visit_count = (
    SELECT COUNT(*) FROM visits 
    WHERE lead_id = leads.id AND status = 'completed'
  ),
  first_visit_date = (
    SELECT MIN(date) FROM visits 
    WHERE lead_id = leads.id AND status = 'completed'
  ),
  last_visit_date = (
    SELECT MAX(date) FROM visits 
    WHERE lead_id = leads.id AND status = 'completed'
  ),
  lead_age_days = EXTRACT(days FROM (NOW() - created_at))::INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN visits.exterior_photos IS 'Array of exterior photo filenames for this visit';
COMMENT ON COLUMN visits.interior_photos IS 'Array of interior photo filenames for this visit';
COMMENT ON COLUMN visits.visit_start_time IS 'When the visit actually started (user input)';
COMMENT ON COLUMN visits.visit_end_time IS 'When the visit actually ended (user input)';
COMMENT ON COLUMN visits.visit_duration_minutes IS 'Calculated duration of the visit in minutes';
COMMENT ON COLUMN visits.visit_number IS 'Sequential visit number for this lead (1st, 2nd, 3rd, etc.)';
COMMENT ON COLUMN visits.photo_count IS 'Total number of photos uploaded for this visit';
COMMENT ON COLUMN visits.visit_latitude IS 'GPS latitude where visit was recorded';
COMMENT ON COLUMN visits.visit_longitude IS 'GPS longitude where visit was recorded';
COMMENT ON COLUMN visits.location_validated IS 'Whether location was validated against lead original location';
COMMENT ON COLUMN visits.location_accuracy_meters IS 'Accuracy of GPS location in meters';
COMMENT ON COLUMN visits.visit_type IS 'Type of visit: initial (first) or revisit (subsequent)';

COMMENT ON COLUMN leads.first_visit_date IS 'Date of the first visit to this lead';
COMMENT ON COLUMN leads.last_visit_date IS 'Date of the most recent visit to this lead';
COMMENT ON COLUMN leads.total_visit_count IS 'Total number of completed visits for this lead';
COMMENT ON COLUMN leads.lead_age_days IS 'Number of days since lead was created';
COMMENT ON COLUMN leads.conversion_date IS 'Date when lead was converted to customer';
COMMENT ON COLUMN leads.lead_status_updated_at IS 'When the lead status was last updated';
