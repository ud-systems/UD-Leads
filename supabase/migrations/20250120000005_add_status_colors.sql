-- Migration: Add status colors system
-- Date: 2025-01-20
-- Description: Add status colors table and update leads table to support dynamic status colors

-- Create status_colors table
CREATE TABLE IF NOT EXISTS status_colors (
    id SERIAL PRIMARY KEY,
    status_name TEXT UNIQUE NOT NULL,
    color_code TEXT NOT NULL,
    background_color TEXT NOT NULL,
    text_color TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add color_id column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS status_color_id INTEGER REFERENCES status_colors(id);

-- Insert default status colors
INSERT INTO status_colors (status_name, color_code, background_color, text_color) VALUES
    ('New Prospect - Not Registered', '#3B82F6', '#DBEAFE', '#1E40AF'),
    ('Active - Buyer', '#10B981', '#D1FAE5', '#065F46'),
    ('Inactive', '#6B7280', '#F3F4F6', '#374151'),
    ('Converted', '#8B5CF6', '#EDE9FE', '#5B21B6'),
    ('Lost', '#EF4444', '#FEE2E2', '#991B1B'),
    ('Pending', '#F59E0B', '#FEF3C7', '#92400E'),
    ('Follow Up', '#EC4899', '#FCE7F3', '#BE185D'),
    ('Qualified', '#06B6D4', '#CFFAFE', '#0E7490'),
    ('Unqualified', '#84CC16', '#F7FEE7', '#4D7C0F'),
    ('On Hold', '#F97316', '#FED7AA', '#C2410C')
ON CONFLICT (status_name) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status_color_id ON leads (status_color_id);
CREATE INDEX IF NOT EXISTS idx_status_colors_active ON status_colors (is_active);

-- Add RLS policies for status_colors table
ALTER TABLE status_colors ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read status colors
CREATE POLICY "Allow authenticated users to read status colors" ON status_colors
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins and managers to manage status colors
CREATE POLICY "Allow admins and managers to manage status colors" ON status_colors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Add system setting for status colors feature
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('status_colors_enabled', 'true', 'Enable dynamic status colors for leads')
ON CONFLICT (setting_key) DO NOTHING;


