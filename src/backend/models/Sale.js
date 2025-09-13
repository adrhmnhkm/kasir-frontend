// Direct database connection based on environment
const isProduction = process.env.NODE_ENV === 'production';
const hasPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let db;

if (isProduction && hasPostgres) {
  // Use PostgreSQL directly in production
  console.log('🐘 Sale model using PostgreSQL for production');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    // Set timezone to Asia/Jakarta for all connections
    options: '-c timezone=Asia/Jakarta'
  });
  
  db = {
    query: async (sql, params = []) => {
      const client = await pool.connect();
      try {
        const result = await client.query(sql, params);
        return result;
      } finally {
        client.release();
      }
    }
  };
} else {
  // Use SQLite for development
  console.log('📱 Sale model using SQLite for development');
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  const dbPath = path.join(__dirname, '../../kasir.db');
  const sqliteDb = new sqlite3.Database(dbPath);
  
  db = {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        // Convert PostgreSQL syntax to SQLite
        let sqliteQuery = sql
          .replace(/\$(\d+)/g, '?')  // Replace $1, $2, etc. with ?
          .replace(/::date/g, '')    // Remove ::date casting
          .replace(/STRING_AGG\((.*?),\s*',\s*'\)/g, 'GROUP_CONCAT($1)'); // Convert STRING_AGG to GROUP_CONCAT
        
        const sqlLower = sqliteQuery.toLowerCase().trim();
        
        if (sqlLower.startsWith('select')) {
          sqliteDb.all(sqliteQuery, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows });
          });
        } else {
          sqliteDb.run(sqliteQuery, params, function(err) {
            if (err) reject(err);
            else resolve({ rows: [], changes: this.changes });
          });
        }
      });
    }
  };
}

class Sale {
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT
          s.*,
          (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
        FROM sales s
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (filters.is_draft !== undefined) {
        conditions.push(`s.is_draft = $${paramIndex++}`);
        values.push(filters.is_draft);
      }
      
      if (filters.startDate) {
        conditions.push(`s.created_at >= $${paramIndex++}`);
        values.push(filters.startDate.toISOString());
      }

      if (filters.endDate) {
        conditions.push(`s.created_at < $${paramIndex++}`);
        values.push(filters.endDate.toISOString());
      }
      
      if (filters.cashier) {
          conditions.push(`LOWER(s.cashier) = LOWER($${paramIndex++})`);
          values.push(filters.cashier);
      }

      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
      }

      query += ` ORDER BY s.created_at DESC`;

      const { rows } = await db.query(query, values);
      return rows;
    } catch (error) {
      console.error('Error fetching sales from database:', error);
      throw error;
    }
}

  static getById(id) {
    return new Promise(async (resolve, reject) => {
      try {
        // Get sale data
        const saleQuery = `
          SELECT s.*, 
                 STRING_AGG(si.product_name || ' x' || si.quantity || ' ' || si.unit_price, ', ') as items_summary
          FROM sales s 
          LEFT JOIN sale_items si ON s.id = si.sale_id 
          WHERE s.id = $1 AND s.is_active = true
          GROUP BY s.id, s.invoice_number, s.customer_id, s.subtotal, s.discount, s.tax, s.total, s.paid, s.change_amount, s.payment_method, s.notes, s.cashier, s.is_draft, s.is_active, s.created_at, s.updated_at
        `;
        
        const result = await db.query(saleQuery, [id]);
        
        if (!result.rows || result.rows.length === 0) {
          reject(new Error('Sale not found'));
          return;
        }
        
        const sale = result.rows[0];
        
        // Debug: Check timestamp from database
        console.log('=== DATABASE TIMESTAMP DEBUG ===');
        console.log('Sale ID:', sale.id);
        console.log('Invoice Number:', sale.invoice_number);
        console.log('Created At from DB:', sale.created_at);
        console.log('Created At type:', typeof sale.created_at);
        console.log('Created At as Date:', new Date(sale.created_at));
        console.log('Created At ISO:', new Date(sale.created_at).toISOString());
        console.log('==================================');
        
        // Get sale items
        try {
          const items = await this.getItemsBySaleId(id);
          sale.items = items;
          resolve(sale);
        } catch (itemsErr) {
          console.error('Error getting sale items:', itemsErr);
          sale.items = [];
          resolve(sale);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  static getItemsBySaleId(saleId) {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          SELECT si.*, p.name as product_name, p.code as product_code
          FROM sale_items si
          LEFT JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = $1
          ORDER BY si.id
        `;
        
        const result = await db.query(query, [saleId]);
        resolve(result.rows);
      } catch (error) {
        reject(error);
      }
    });
  }

  static async create(saleData) {
    try {
      // Generate invoice number using frontend timestamp
      const invoiceNumber = this.generateInvoiceNumber(saleData);
      
      // Debug: Check table structure
      try {
        const tableInfo = await db.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'sales' 
          ORDER BY ordinal_position
        `);
        console.log('=== SALES TABLE STRUCTURE ===');
        console.log('Columns:', tableInfo.rows.map(row => row.column_name));
        console.log('================================');
      } catch (tableError) {
        console.log('Error checking table structure:', tableError.message);
      }

      // Insert sale first
      const saleQuery = `
        INSERT INTO sales (
          invoice_number, customer_id, subtotal, discount, tax, total,
          paid, change_amount, payment_method, notes, cashier, is_draft,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `;
      
      // Debug timestamp
      const receivedTimestamp = saleData.created_at || new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T');
      console.log('Received timestamp from frontend:', receivedTimestamp);
      console.log('Current server time:', new Date().toISOString());
      
      // Convert Jakarta time to proper format for database storage
      let dbTimestamp;
      if (saleData.created_at) {
        // Frontend sends Jakarta time string, convert to proper format
        console.log('=== TIMESTAMP CONVERSION DEBUG ===');
        console.log('Frontend timestamp:', saleData.created_at);
        console.log('Frontend timestamp type:', typeof saleData.created_at);
        
        const jakartaTime = new Date(saleData.created_at);
        console.log('Jakarta time object:', jakartaTime);
        console.log('Jakarta time toString:', jakartaTime.toString());
        console.log('Jakarta time toISOString:', jakartaTime.toISOString());
        
        // Convert Jakarta time to UTC for database storage
        // Frontend sends: "2025-09-13 20:42:23" (Jakarta time)
        // Convert to UTC: "2025-09-13T13:42:23.000Z"
        const jakartaTimeString = saleData.created_at; // "2025-09-13 20:42:23"
        const utcTime = new Date(jakartaTimeString + '+07:00').toISOString();
        dbTimestamp = utcTime;
        console.log('Jakarta time from frontend:', jakartaTimeString);
        console.log('Converted to UTC for DB:', dbTimestamp);
        console.log('=====================================');
      } else {
        // Fallback to server Jakarta time
        const serverTime = new Date();
        const jakartaLocaleString = serverTime.toLocaleString('en-US', { 
          timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        const [datePart, timePart] = jakartaLocaleString.split(', ');
        const [month, day, year] = datePart.split('/');
        const [hour, minute, second] = timePart.split(':');
        const fallbackJakartaTimeString = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        const fallbackUtcTime = new Date(fallbackJakartaTimeString + '+07:00').toISOString();
        dbTimestamp = fallbackUtcTime;
        console.log('Fallback Jakarta time:', fallbackJakartaTimeString);
        console.log('Fallback converted to UTC for DB:', dbTimestamp);
      }
      
      const saleValues = [
        invoiceNumber,
        saleData.customer_id || null,
        parseFloat(saleData.subtotal),
        parseFloat(saleData.discount) || 0,
        parseFloat(saleData.tax) || 0,
        parseFloat(saleData.total),
        parseFloat(saleData.paid) || 0,
        parseFloat(saleData.change_amount) || 0,
        saleData.payment_method || 'cash',
        saleData.notes || '',
        saleData.cashier || 'Kasir',
        saleData.is_draft || false,
        dbTimestamp,  // created_at
        dbTimestamp   // updated_at
      ];
      
      const result = await db.query(saleQuery, saleValues);
      const saleId = result.rows[0].id;
      console.log('Created sale with ID:', saleId);
      
      // Insert sale items if any
      if (saleData.items && saleData.items.length > 0) {
        const itemQuery = `
          INSERT INTO sale_items (
            sale_id, product_id, product_name, quantity, unit_price, 
            discount, total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        for (const item of saleData.items) {
          const productName = item.product_name || `Product ${item.product_id}`;
          
          const itemValues = [
            saleId,
            item.product_id,
            productName,
            parseFloat(item.quantity),
            parseFloat(item.unit_price),
            parseFloat(item.discount) || 0,
            parseFloat(item.total)
          ];
          
          console.log('Inserting item:', itemValues);
          await db.query(itemQuery, itemValues);
        }
      }
      
      // Return the complete sale
      return await Sale.getById(saleId);
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  static updateProductStock(items, saleId, invoiceNumber) {
    return new Promise((resolve, reject) => {
      const Product = require('./Product');
      const StockMovement = require('./StockMovement');
      
      let itemsProcessed = 0;
      items.forEach(item => {
        Product.getById(item.product_id)
          .then(product => {
            if (product) {
              const quantityBefore = product.stock;
              return Product.adjustStock(item.product_id, -item.quantity)
                .then(() => {
                  return StockMovement.create({
                    product_id: item.product_id,
                    product_name: product.name,
                    type: 'keluar',
                    quantity: item.quantity,
                    quantity_before: quantityBefore,
                    quantity_after: quantityBefore - item.quantity,
                    unit_cost: product.purchase_price || 0,
                    total_cost: (product.purchase_price || 0) * item.quantity,
                    reference_type: 'sale',
                    reference_id: saleId,
                    notes: `Penjualan ${invoiceNumber}`,
                    user: 'Kasir'
                  });
                });
            }
          })
          .then(() => {
            itemsProcessed++;
            if (itemsProcessed === items.length) {
              resolve();
            }
          })
          .catch(err => {
            reject(err);
          });
      });
    });
  }

  static async update(id, saleData) {
    try {
      const query = `
        UPDATE sales SET 
          customer_id = $1, subtotal = $2, discount = $3, tax = $4, total = $5,
          paid = $6, change_amount = $7, payment_method = $8, notes = $9,
          cashier = $10, is_draft = $11, updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
      `;
      
      const values = [
        saleData.customer_id || null,
        parseFloat(saleData.subtotal),
        parseFloat(saleData.discount) || 0,
        parseFloat(saleData.tax) || 0,
        parseFloat(saleData.total),
        parseFloat(saleData.paid) || 0,
        parseFloat(saleData.change_amount) || 0,
        saleData.payment_method || 'cash',
        saleData.notes || '',
        saleData.cashier || 'Kasir',
        saleData.is_draft || false,
        id
      ];
      
      await db.query(query, values);
      return await Sale.getById(id);
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'UPDATE sales SET is_active = false WHERE id = $1';
      await db.query(query, [id]);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  static async finalize(id) {
    try {
      const query = 'UPDATE sales SET is_draft = false WHERE id = $1';
      await db.query(query, [id]);
      return await Sale.getById(id);
    } catch (error) {
      throw error;
    }
  }

  static async getDrafts() {
    try {
      const query = `
        SELECT s.*, 
               STRING_AGG(si.product_name || ' x' || si.quantity, ', ') as items_summary
        FROM sales s 
        LEFT JOIN sale_items si ON s.id = si.sale_id 
        WHERE s.is_draft = true AND s.is_active = true
        GROUP BY s.id, s.invoice_number, s.customer_id, s.subtotal, s.discount, s.tax, s.total, s.paid, s.change_amount, s.payment_method, s.notes, s.cashier, s.is_draft, s.is_active, s.created_at, s.updated_at
        ORDER BY s.created_at DESC
      `;
      
      const result = await db.query(query, []);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  static async getByDateRange(startDate, endDate) {
    try {
      console.log(`📊 [Sale.getByDateRange] Starting date range query`);
      
      // Ensure startDate and endDate are strings
      const start = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
      const end = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
      
      console.log(`📅 [Sale.getByDateRange] Searching between ${start} and ${end}`);
      
      // Simplified query for both PostgreSQL and SQLite
      const query = `
        SELECT s.*, 
               COUNT(si.id) as item_count,
               STRING_AGG(si.product_name || ' x' || si.quantity, ', ') as items_summary
        FROM sales s 
        LEFT JOIN sale_items si ON s.id = si.sale_id 
        WHERE s.is_active = true 
          AND DATE(s.created_at) >= $1 
          AND DATE(s.created_at) <= $2
        GROUP BY s.id, s.invoice_number, s.customer_id, s.subtotal, s.discount, s.tax, s.total, s.paid, s.change_amount, s.payment_method, s.notes, s.cashier, s.is_draft, s.is_active, s.created_at, s.updated_at
        ORDER BY s.created_at DESC
      `;
      
      const result = await db.query(query, [start, end]);
      console.log(`✅ [Sale.getByDateRange] Found ${result.rows.length} sales`);
      
      if (result.rows.length > 0) {
        console.log(`📈 Sample data:`, result.rows.slice(0, 2).map(r => ({
          id: r.id,
          invoice: r.invoice_number,
          total: r.total,
          created_at: r.created_at,
          is_draft: r.is_draft
        })));
      }
      
      return result.rows;
    } catch (error) {
      console.error('❌ [Sale.getByDateRange] Error:', error);
      
      // Fallback: try to get recent sales without date filtering
      try {
        console.log('🔄 [Sale.getByDateRange] Fallback to recent sales');
        const fallbackQuery = "SELECT * FROM sales WHERE is_active = true ORDER BY created_at DESC LIMIT 10";
        const fallbackResult = await db.query(fallbackQuery, []);
        
        return fallbackResult.rows.map(row => ({
          ...row,
          item_count: 1,
          items_summary: 'Recent Sale'
        }));
      } catch (fallbackError) {
        console.error('❌ [Sale.getByDateRange] Fallback failed:', fallbackError);
        return [];
      }
    }
  }

  static generateInvoiceNumber(saleData = null) {
    // Use timestamp from frontend if available, otherwise use server Jakarta time
    let now;
    
    if (saleData && saleData.created_at) {
      // Use timestamp from frontend (already Jakarta time)
      now = new Date(saleData.created_at);
      console.log('=== USING FRONTEND TIMESTAMP ===');
      console.log('Frontend timestamp:', saleData.created_at);
    } else {
      // Fallback to server Jakarta time
      const serverTime = new Date();
      const jakartaTimeString = serverTime.toLocaleString('en-US', { 
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Parse Jakarta time string
      const [datePart, timePart] = jakartaTimeString.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hour, minute, second] = timePart.split(':');
      now = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
      
      console.log('=== USING SERVER JAKARTA TIME ===');
    }
    
    // Debug: Show Jakarta time
    console.log('=== BACKEND INVOICE GENERATION DEBUG ===');
    console.log('Input saleData.created_at:', saleData?.created_at);
    console.log('Now object:', now);
    console.log('Now toString:', now.toString());
    console.log('Now toISOString:', now.toISOString());
    console.log('Now toLocaleString:', now.toLocaleString());
    
    // Extract time components from Jakarta time
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const time = String(now.getUTCHours()).padStart(2, '0') + 
                 String(now.getUTCMinutes()).padStart(2, '0') + 
                 String(now.getUTCSeconds()).padStart(2, '0');
    
    const invoiceNumber = `INV-${year}${month}${day}-${time}`;
    
    console.log('UTC Components:');
    console.log('Year:', year, 'Month:', month, 'Day:', day);
    console.log('Hour:', now.getUTCHours(), 'Minute:', now.getUTCMinutes(), 'Second:', now.getUTCSeconds());
    console.log('Local Components:');
    console.log('Hour:', now.getHours(), 'Minute:', now.getMinutes(), 'Second:', now.getSeconds());
    console.log('Generated invoice:', invoiceNumber);
    console.log('==========================================');
    
    return invoiceNumber;
  }

  static async getSummary() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_sales,
          SUM(total) as total_revenue,
          SUM(paid) as total_paid,
          SUM(change_amount) as total_change,
          AVG(total) as avg_sale_value
        FROM sales 
        WHERE is_active = true AND is_draft = false
      `;
      
      const result = await db.query(query, []);
      return result.rows?.[0] || result[0];
    } catch (error) {
      throw error;
    }
  }


  static async getTopProducts(startDate, endDate, limit = 5) {
    try {
      console.log(`📊 [Sale.getTopProducts] Getting top products`);
      
      const start = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
      const end = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
      
      const query = `
        SELECT 
          p.id,
          p.name,
          p.code,
          CAST(SUM(si.quantity) AS INTEGER) as quantity,
          CAST(SUM(si.total) AS DECIMAL) as revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.is_active = true 
          AND s.is_draft = false
          AND DATE(s.created_at) >= $1 
          AND DATE(s.created_at) <= $2
        GROUP BY p.id, p.name, p.code
        ORDER BY quantity DESC
        LIMIT $3
      `;
      
      const result = await db.query(query, [start, end, limit]);
      console.log(`✅ [Sale.getTopProducts] Found ${result.rows.length} top products`);
      
      return result.rows;
    } catch (error) {
      console.error('❌ [Sale.getTopProducts] Error:', error);
      return [];
    }
  }


  // Initialize products, sales, and sale_items tables
static async initialize() {
  try {
    // Create products table
    const createProductsTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        price NUMERIC NOT NULL,
        stock NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createProductsTableQuery);

    // Create sales table
    const createSalesTableQuery = `
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        subtotal NUMERIC NOT NULL,
        discount NUMERIC DEFAULT 0,
        tax NUMERIC DEFAULT 0,
        total NUMERIC NOT NULL,
        paid NUMERIC DEFAULT 0,
        change_amount NUMERIC DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        notes TEXT,
        cashier TEXT DEFAULT 'Kasir',
        is_draft BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createSalesTableQuery);

    // Migration: Add created_at and updated_at columns if they don't exist
    try {
      await db.query(`
        ALTER TABLE sales 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `);
      await db.query(`
        ALTER TABLE sales 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Migration: Added created_at and updated_at columns to sales table');
    } catch (migrationError) {
      console.log('Migration info:', migrationError.message);
    }

    // Create sale_items table
    const createSaleItemsTableQuery = `
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products (id),
        product_name TEXT NOT NULL,
        quantity NUMERIC NOT NULL,
        unit_price NUMERIC NOT NULL,
        discount NUMERIC DEFAULT 0,
        total NUMERIC NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createSaleItemsTableQuery);

    return true;
  } catch (error) {
    throw error;
  }
}
}

module.exports = Sale; 