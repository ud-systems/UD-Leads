-- Add 'Petrol Station Forecourt' to the store_type enum
-- Safe approach that handles existing enum types

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
        END IF;
    END IF;
END $$;

