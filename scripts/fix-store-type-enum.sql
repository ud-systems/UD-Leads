-- Fix: Add 'Petrol Station Forecourt' to store_type enum
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/uiprdzdskaqakfwhzssc/editor

-- This script safely adds the missing store type value to the enum
DO $$ 
BEGIN
    -- Check if the enum type exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_type_enum') THEN
        -- Check if 'Petrol Station Forecourt' value already exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'store_type_enum')
            AND enumlabel = 'Petrol Station Forecourt'
        ) THEN
            -- Add the new value to existing enum
            ALTER TYPE store_type_enum ADD VALUE 'Petrol Station Forecourt';
            RAISE NOTICE '✅ Added "Petrol Station Forecourt" to store_type_enum';
        ELSE
            RAISE NOTICE 'ℹ️  "Petrol Station Forecourt" already exists in store_type_enum';
        END IF;
    ELSE
        RAISE EXCEPTION '❌ store_type_enum does not exist! Please check your database schema.';
    END IF;
END $$;

-- Verify the enum values
SELECT enumlabel as store_type_value 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'store_type_enum')
ORDER BY enumlabel;


