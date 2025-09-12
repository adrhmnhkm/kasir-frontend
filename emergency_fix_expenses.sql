-- Emergency fix: Drop and recreate expenses table
-- This will fix the is_active column issue

-- Drop existing expenses table (WARNING: This will delete all data!)
DROP TABLE IF EXISTS expenses CASCADE;

-- Recreate expenses table with correct structure
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category VARCHAR(100) DEFAULT 'lainnya',
  payment_method VARCHAR(50) DEFAULT 'cash',
  reference_number VARCHAR(255),
  notes TEXT,
  user VARCHAR(255) DEFAULT 'Admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify the table structure
\d expenses;
