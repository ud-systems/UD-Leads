-- Add 'Mobile Phone Shop' to the store_type enum
-- First, check if the enum exists and add the new value

-- Create the enum type if it doesn't exist (with all current values)
DO $$ 
BEGIN
    -- Check if the enum type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_type_enum') THEN
        -- Create the enum type with all values
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
        
        -- Alter the leads table to use the enum type
        ALTER TABLE leads ALTER COLUMN store_type TYPE store_type_enum USING store_type::store_type_enum;
    ELSE
        -- Add the new value to existing enum
        ALTER TYPE store_type_enum ADD VALUE 'Mobile Phone Shop';
    END IF;
END $$;
