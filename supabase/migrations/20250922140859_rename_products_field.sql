-- Rename products_currently_sold column to top_3_selling_products
-- Only rename if the source column exists and target column doesn't exist
DO $$
BEGIN
    -- Check if products_currently_sold exists and top_3_selling_products doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'products_currently_sold'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'top_3_selling_products'
    ) THEN
        ALTER TABLE leads RENAME COLUMN products_currently_sold TO top_3_selling_products;
    END IF;
END $$;
