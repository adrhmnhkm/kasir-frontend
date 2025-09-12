const { Pool } = require('pg');

// Database connection configuration
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Set timezone to Asia/Jakarta for all connections
  options: '-c timezone=Asia/Jakarta'
});

// Test connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error.message);
    return false;
  }
}

// Initialize database tables
async function initializeTables() {
  const client = await pool.connect();
  
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        code VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        cost_price DECIMAL(15,2) DEFAULT 0,
        selling_price DECIMAL(15,2) NOT NULL,
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        description TEXT,
        barcode VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(255) NOT NULL UNIQUE,
        customer_id INTEGER,
        subtotal DECIMAL(15,2) NOT NULL,
        discount DECIMAL(15,2) DEFAULT 0,
        tax DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) NOT NULL,
        paid DECIMAL(15,2) DEFAULT 0,
        change_amount DECIMAL(15,2) DEFAULT 0,
        payment_method VARCHAR(50) DEFAULT 'cash',
        notes TEXT,
        cashier VARCHAR(255) DEFAULT 'Kasir',
        is_draft BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        discount DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        category VARCHAR(100),
        payment_method VARCHAR(50) DEFAULT 'cash',
        notes TEXT,
        receipt_number VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        type VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Insert default categories if empty
    const categoryCount = await client.query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoryCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO categories (name, description) VALUES 
        ('Elektronik', 'Produk elektronik dan gadget'),
        ('Makanan', 'Makanan dan minuman'),
        ('Pakaian', 'Pakaian dan aksesoris')
      `);
    }

    console.log('✅ PostgreSQL tables initialized');
  } catch (error) {
    console.error('❌ Error initializing tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testConnection,
  initializeTables,
  query: (text, params) => pool.query(text, params),
};
