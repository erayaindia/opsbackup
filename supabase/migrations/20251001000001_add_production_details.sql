-- Add production_details column to product_production table
ALTER TABLE product_production
ADD COLUMN IF NOT EXISTS production_details TEXT;
