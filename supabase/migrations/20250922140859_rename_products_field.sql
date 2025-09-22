-- Rename products_currently_sold column to top_3_selling_products
ALTER TABLE leads RENAME COLUMN products_currently_sold TO top_3_selling_products;
