-- ============================================================================
-- MIGRATION: Remove store_type ENUM constraint → Convert to TEXT
-- ============================================================================
-- Purpose: Enable truly dynamic store types without requiring migrations
-- Impact: Preserves all existing data, allows any future store type values
-- Run this in: https://supabase.com/dashboard/project/uiprdzdskaqakfwhzssc/editor
-- ============================================================================

DO $$ 
BEGIN
    -- Convert store_type column from ENUM to TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'store_type'
        AND udt_name = 'store_type_enum'
    ) THEN
        ALTER TABLE leads 
        ALTER COLUMN store_type TYPE TEXT 
        USING store_type::TEXT;
        
        RAISE NOTICE '✅ Converted store_type from ENUM to TEXT';
    ELSE
        RAISE NOTICE 'ℹ️  Column is already TEXT';
    END IF;
    
    -- Drop the unused enum type
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_type_enum') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'store_type_enum'
        ) THEN
            DROP TYPE store_type_enum;
            RAISE NOTICE '✅ Removed store_type_enum constraint';
        END IF;
    END IF;
END $$;

-- Add documentation
COMMENT ON COLUMN leads.store_type IS 'Store type - dynamically managed via system_settings. Any text value accepted.';

-- Verify the change
SELECT 
    'store_type column is now: ' || data_type as status
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'store_type';

