-- Add multiple photos support to leads table
-- This migration adds array fields for storing multiple exterior and interior photos

-- Add new array columns for multiple photos
ALTER TABLE leads 
ADD COLUMN exterior_photos TEXT[] DEFAULT '{}',
ADD COLUMN interior_photos TEXT[] DEFAULT '{}';

-- Add comments to document the new fields
COMMENT ON COLUMN leads.exterior_photos IS 'Array of exterior photo URLs for the lead';
COMMENT ON COLUMN leads.interior_photos IS 'Array of interior photo URLs for the lead';

-- Create indexes for better query performance on photo arrays
CREATE INDEX idx_leads_exterior_photos ON leads USING GIN (exterior_photos);
CREATE INDEX idx_leads_interior_photos ON leads USING GIN (interior_photos);

-- Update existing records to migrate single photos to arrays
-- This preserves existing data by moving single photo URLs to the new array fields
UPDATE leads 
SET 
  exterior_photos = CASE 
    WHEN exterior_photo_url IS NOT NULL AND exterior_photo_url != '' 
    THEN ARRAY[exterior_photo_url] 
    ELSE '{}' 
  END,
  interior_photos = CASE 
    WHEN interior_photo_url IS NOT NULL AND interior_photo_url != '' 
    THEN ARRAY[interior_photo_url] 
    ELSE '{}' 
  END
WHERE exterior_photos IS NULL OR interior_photos IS NULL;
