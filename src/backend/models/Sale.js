const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use SQLite database
const dbPath = path.join(__dirname, '../../kasir.db');
const db = new sqlite3.Database(dbPath);

class Sale {
  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT s.*, 
               GROUP_CONCAT(si.product_name || ' x' || si.quantity || ' ' || si.unit_price) as items_summary
        FROM sales s 
        LEFT JOIN sale_items si ON s.id = si.sale_id 
        WHERE s.is_active = 1
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getById(id) {
    return new Promise(async (resolve, reject) => {
      try {
        // Get sale data
        const saleQuery = `
          SELECT s.*, 
                 GROUP_CONCAT(si.product_name || ' x' || si.quantity || ' ' || si.unit_price) as items_summary
          FROM sales s 
          LEFT JOIN sale_items si ON s.id = si.sale_id 
          WHERE s.id = ? AND s.is_active = 1
          GROUP BY s.id
        `;
        
        db.get(saleQuery, [id], async (err, sale) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!sale) {
            reject(new Error('Sale not found'));
            return;
          }
          
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
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  static getItemsBySaleId(saleId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT si.*, p.name as product_name, p.code as product_code
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
        ORDER BY si.id
      `;
      
      db.all(query, [saleId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static create(saleData) {
    return new Promise((resolve, reject) => {
      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber();
      
      // Insert sale first
      const saleQuery = `
        INSERT INTO sales (
          invoice_number, customer_id, subtotal, discount, tax, total,
          paid, change_amount, payment_method, notes, cashier, is_draft
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
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
        saleData.is_draft || false
      ];
      
      db.run(saleQuery, saleValues, function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        const saleId = this.lastID;
        console.log('Created sale with ID:', saleId);
        
        // Insert sale items if any
        if (saleData.items && saleData.items.length > 0) {
          const itemQuery = `
            INSERT INTO sale_items (
              sale_id, product_id, product_name, quantity, unit_price, 
              discount, total
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          
          let itemsProcessed = 0;
          saleData.items.forEach(item => {
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
            
            db.run(itemQuery, itemValues, function(err) {
              if (err) {
                console.error('Error inserting item:', err);
                reject(err);
                return;
              }
              
              itemsProcessed++;
              console.log(`Item ${itemsProcessed}/${saleData.items.length} inserted`);
              
              if (itemsProcessed === saleData.items.length) {
                // All items inserted, get the complete sale
                Sale.getById(saleId).then(resolve).catch(reject);
              }
            });
          });
        } else {
          // No items, just return the sale
          Sale.getById(saleId).then(resolve).catch(reject);
        }
      });
    });
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

  static update(id, saleData) {
    return new Promise((resolve, reject) => {
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
      
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.getById(id));
        }
      }.bind(this));
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE sales SET is_active = 0 WHERE id = ?';
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  static finalize(id) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE sales SET is_draft = 0 WHERE id = ?';
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.getById(id));
        }
      }.bind(this));
    });
  }

  static getDrafts() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT s.*, 
               GROUP_CONCAT(si.product_name || ' x' || si.quantity) as items_summary
        FROM sales s 
        LEFT JOIN sale_items si ON s.id = si.sale_id 
        WHERE s.is_draft = 1 AND s.is_active = 1
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT s.*, 
               COUNT(si.id) as item_count,
               GROUP_CONCAT(si.product_name || ' x' || si.quantity) as items_summary
        FROM sales s 
        LEFT JOIN sale_items si ON s.id = si.sale_id 
        WHERE s.is_active = 1 
          AND s.created_at >= ? 
          AND s.created_at <= ?
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `;
      
      // Ensure startDate and endDate are strings
      const start = typeof startDate === 'string' ? startDate : startDate.toISOString();
      const end = typeof endDate === 'string' ? endDate : endDate.toISOString();
      
      db.all(query, [start, end], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + 
                 String(now.getMinutes()).padStart(2, '0') + 
                 String(now.getSeconds()).padStart(2, '0');
    
    return `INV-${year}${month}${day}-${time}`;
  }

  static getSummary() {
    return new Promise((resolve, reject) => {
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
      
      db.get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }


  static getTopProducts(startDate, endDate, limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.code,
          SUM(si.quantity) as quantity,
          SUM(si.total) as revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.is_active = 1 
          AND s.is_draft = 0
          AND s.created_at >= ? 
          AND s.created_at <= ?
        GROUP BY p.id, p.name, p.code
        ORDER BY quantity DESC
        LIMIT ?
      `;
      
      const start = typeof startDate === 'string' ? startDate : startDate.toISOString();
      const end = typeof endDate === 'string' ? endDate : endDate.toISOString();
      
      db.all(query, [start, end, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getDrafts() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM sales 
        WHERE is_active = 1 AND is_draft = 1
        ORDER BY created_at DESC
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Initialize sales and sale_items tables
  static async initialize() {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
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

        db.run(createSalesTableQuery, [], (err) => {
          if (err) {
            reject(err);
            return;
          }

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

          db.run(createSaleItemsTableQuery, [], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
    });
  }
}

module.exports = Sale; 