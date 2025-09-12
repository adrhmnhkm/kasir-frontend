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
  static async getAll() {
    try {
      const query = `
        SELECT s.*, 
               STRING_AGG(si.product_name || ' x' || si.quantity || ' ' || si.unit_price, ', ') as items_summary
        FROM sales s 
        LEFT JOIN sale_items si ON s.id = si.sale_id 
        WHERE s.is_active = 1
        GROUP BY s.id, s.invoice_number, s.customer_id, s.subtotal, s.discount, s.tax, s.total, s.paid, s.change_amount, s.payment_method, s.notes, s.cashier, s.is_draft, s.is_active, s.created_at, s.updated_at
        ORDER BY s.created_at DESC
      `;
      
      const result = await db.query(query, []);
      return result.rows;
    } catch (error) {
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
          WHERE s.id = $1 AND s.is_active = 1
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
      
      // Insert sale first
      const saleQuery = `
        INSERT INTO sales (
          invoice_number, customer_id, subtotal, discount, tax, total,
          paid, change_amount, payment_method, notes, cashier, is_draft,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // Debug timestamp
      const receivedTimestamp = saleData.created_at || new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T');
      console.log('Received timestamp from frontend:', receivedTimestamp);
      console.log('Current server time:', new Date().toISOString());
      
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
        receivedTimestamp,
        receivedTimestamp
      ];
      
      const result = await db.query(saleQuery, saleValues);
      const saleId = result.insertId || result.rows?.[0]?.id;
      console.log('Created sale with ID:', saleId);
      
      // Insert sale items if any
      if (saleData.items && saleData.items.length > 0) {
        const itemQuery = `
          INSERT INTO sale_items (
            sale_id, product_id, product_name, quantity, unit_price, 
            discount, total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
            parseFloat(item.total),
            saleData.created_at || new Date().toISOString()
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
          customer_id = ?, subtotal = ?, discount = ?, tax = ?, total = ?,
          paid = ?, change_amount = ?, payment_method = ?, notes = ?,
          cashier = ?, is_draft = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
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
      const query = 'UPDATE sales SET is_active = 0 WHERE id = ?';
      await db.query(query, [id]);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  static async finalize(id) {
    try {
      const query = 'UPDATE sales SET is_draft = 0 WHERE id = ?';
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
        WHERE s.is_draft = 1 AND s.is_active = 1
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
        WHERE s.is_active = 1 
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
        const fallbackQuery = "SELECT * FROM sales WHERE is_active = 1 ORDER BY created_at DESC LIMIT 10";
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
    console.log('=== INVOICE NUMBER GENERATION DEBUG ===');
    console.log('Jakarta time:', now.toISOString());
    
    // Extract time components from Jakarta time
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const time = String(now.getUTCHours()).padStart(2, '0') + 
                 String(now.getUTCMinutes()).padStart(2, '0') + 
                 String(now.getUTCSeconds()).padStart(2, '0');
    
    const invoiceNumber = `INV-${year}${month}${day}-${time}`;
    
    console.log('Parsed components:');
    console.log('Year:', year, 'Month:', month, 'Day:', day);
    console.log('Hour:', now.getUTCHours(), 'Minute:', now.getUTCMinutes(), 'Second:', now.getUTCSeconds());
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
        WHERE is_active = 1 AND is_draft = 0
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
        WHERE s.is_active = 1 
          AND s.is_draft = 0
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


  // Initialize sales and sale_items tables
  static async initialize() {
    try {
      // Create sales table
      const createSalesTableQuery = `
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_number TEXT UNIQUE NOT NULL,
          customer_id INTEGER,
          subtotal REAL NOT NULL,
          discount REAL DEFAULT 0,
          tax REAL DEFAULT 0,
          total REAL NOT NULL,
          paid REAL DEFAULT 0,
          change_amount REAL DEFAULT 0,
          payment_method TEXT DEFAULT 'cash',
          notes TEXT,
          cashier TEXT DEFAULT 'Kasir',
          is_draft BOOLEAN DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await db.query(createSalesTableQuery, []);

      // Create sale_items table
      const createSaleItemsTableQuery = `
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          quantity REAL NOT NULL,
          unit_price REAL NOT NULL,
          discount REAL DEFAULT 0,
          total REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sale_id) REFERENCES sales (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `;

      await db.query(createSaleItemsTableQuery, []);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Sale; 