-- Migration script to add missing columns to expenses table
-- Run this directly in PostgreSQL if needed

-- Add missing columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(255);

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS user VARCHAR(255) DEFAULT 'Admin';

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to have is_active = true
UPDATE expenses SET is_active = true WHERE is_active IS NULL;

-- Verify the table structure
\d expenses;
