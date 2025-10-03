-- Add 'Mobile Phone Shop' to the store_type enum
-- Safe approach that handles existing enum types

DO $$ 
BEGIN
    -- Check if the enum type exists and if 'Mobile Phone Shop' value already exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_type_enum') THEN
        -- Check if 'Mobile Phone Shop' value already exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'store_type_enum')
            AND enumlabel = 'Mobile Phone Shop'
        ) THEN
            -- Add the new value to existing enum
            ALTER TYPE store_type_enum ADD VALUE 'Mobile Phone Shop';
        END IF;
    ELSE
        -- Create the enum type with all values including the new one
        CREATE TYPE store_type_enum AS ENUM (
            'Vape Shop',
            'Convenience Store', 
            'Supermarket',
            'Tobacco Shop',
            'Gas Station',
            'Pharmacy',
            'Other',
            'Mobile Phone Shop'
        );
        
        -- Only alter the column if it's not already using the enum type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'leads' 
            AND column_name = 'store_type' 
            AND data_type != 'USER-DEFINED'
        ) THEN
            -- Alter the leads table to use the enum type
            ALTER TABLE leads ALTER COLUMN store_type TYPE store_type_enum USING store_type::text::store_type_enum;
        END IF;
    END IF;
END $$;
