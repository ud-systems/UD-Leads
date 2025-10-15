-- Migration: Remove store_type enum constraint and convert to TEXT
-- This allows dynamic store types without database schema changes
-- All existing data is preserved

DO $$ 
BEGIN
    -- Check if the store_type column exists and uses enum
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'store_type'
        AND udt_name = 'store_type_enum'
    ) THEN
        -- Convert the column from enum to TEXT while preserving all data
        ALTER TABLE leads 
        ALTER COLUMN store_type TYPE TEXT 
        USING store_type::TEXT;
        
        RAISE NOTICE '✅ Converted store_type column from ENUM to TEXT';
    ELSE
        RAISE NOTICE 'ℹ️  store_type column is already TEXT or does not exist';
    END IF;
    
    -- Drop the enum type if it exists and is no longer used
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_type_enum') THEN
        -- Check if enum is still used by any other columns
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'store_type_enum'
        ) THEN
            DROP TYPE store_type_enum;
            RAISE NOTICE '✅ Dropped unused store_type_enum type';
        ELSE
            RAISE NOTICE '⚠️  store_type_enum is still in use by other columns, keeping it';
        END IF;
    END IF;
    
END $$;

-- Add a comment to document this change
COMMENT ON COLUMN leads.store_type IS 'Store type - dynamically managed via system_settings table. Any text value is accepted.';

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'store_type';

