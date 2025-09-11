const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use SQLite database
const dbPath = path.join(__dirname, '../../kasir.db');
const db = new sqlite3.Database(dbPath);

class Product {
  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = 1
        ORDER BY p.name
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
    return new Promise((resolve, reject) => {
      const query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ? AND p.is_active = 1
      `;
      
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static existsByCode(code) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id FROM products WHERE code = ? AND is_active = 1';
      
      db.get(query, [code], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }

  static existsByBarcode(barcode) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id FROM products WHERE barcode = ? AND is_active = 1';
      
      db.get(query, [barcode], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }

  static create(productData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO products (
          code, name, category_id, purchase_price, selling_price,
          stock, unit, alt_unit, alt_unit_conversion, min_stock, 
          barcode, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        productData.code,
        productData.name,
        productData.category_id || null,
        parseFloat(productData.purchase_price) || 0,
        parseFloat(productData.selling_price),
        parseFloat(productData.stock) || 0,
        productData.unit,
        productData.alt_unit || null,
        parseFloat(productData.alt_unit_conversion) || 1,
        parseFloat(productData.min_stock) || 0,
        productData.barcode || null,
        productData.description || null
      ];
      
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          // Get the created product
          Product.getById(this.lastID)
            .then(product => resolve(product))
            .catch(reject);
        }
      });
    });
  }

  static update(id, productData) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE products 
        SET code = ?, name = ?, category_id = ?, purchase_price = ?, 
            selling_price = ?, stock = ?, unit = ?, alt_unit = ?, 
            alt_unit_conversion = ?, min_stock = ?, barcode = ?, 
            description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      
      const values = [
        productData.code,
        productData.name,
        productData.category_id || null,
        parseFloat(productData.purchase_price) || 0,
        parseFloat(productData.selling_price),
        parseFloat(productData.stock) || 0,
        productData.unit,
        productData.alt_unit || null,
        parseFloat(productData.alt_unit_conversion) || 1,
        parseFloat(productData.min_stock) || 0,
        productData.barcode || null,
        productData.description || null,
        id
      ];
      
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          // Get the updated product
          Product.getById(id)
            .then(product => resolve(product))
            .catch(reject);
        }
      });
    });
  }

  static updateStock(id, newStock) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE products 
        SET stock = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      
      db.run(query, [parseFloat(newStock), id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          // Get the updated product
          Product.getById(id)
            .then(product => resolve(product))
            .catch(reject);
        }
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      // Soft delete - set is_active to 0
      const query = `
        UPDATE products 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Method khusus untuk update status
  static updateStatus(id, isActive) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE products 
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.run(query, [isActive ? 1 : 0, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static getLowStock() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT p.*, c.name as category_name,
               CASE 
                 WHEN p.stock = 0 THEN 'habis'
                 WHEN p.stock <= p.min_stock THEN 'menipis'
                 ELSE 'aman'
               END as status,
               MAX(0, p.min_stock - p.stock) as shortage
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = 1 AND p.stock <= p.min_stock
        ORDER BY p.stock ASC, p.name
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

  static search(searchTerm, categoryId) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = 1
      `;
      const params = [];

      if (searchTerm) {
        query += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (categoryId) {
        query += ' AND p.category_id = ?';
        params.push(categoryId);
      }

      query += ' ORDER BY p.name';

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Adjust stock (add or subtract)
  static adjustStock(productId, quantity) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE products 
        SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      
      db.run(query, [quantity, productId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Product not found or not active'));
        } else {
          resolve({ success: true, changes: this.changes });
        }
      });
    });
  }

  // Update purchase price
  static updatePurchasePrice(productId, purchasePrice) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE products 
        SET purchase_price = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      
      db.run(query, [purchasePrice, productId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Product not found or not active'));
        } else {
          resolve({ success: true, changes: this.changes });
        }
      });
    });
  }

  // Initialize products table with default data
  static async initialize() {
    return new Promise((resolve, reject) => {
      // Create table if not exists
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          category_id INTEGER,
          purchase_price REAL DEFAULT 0,
          selling_price REAL NOT NULL,
          stock REAL DEFAULT 0,
          unit TEXT NOT NULL,
          alt_unit TEXT,
          alt_unit_conversion REAL DEFAULT 1,
          min_stock REAL DEFAULT 0,
          barcode TEXT,
          description TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        )
      `;

      db.run(createTableQuery, [], (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Check if products already exist
        db.get('SELECT COUNT(*) as count FROM products', [], (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row.count === 0) {
            // Insert default products
            const defaultProducts = [
              {
                code: 'PVC001', name: 'Pipa PVC 1/2"', category_id: 1,
                purchase_price: 15000, selling_price: 18000, stock: 50, unit: 'batang',
                alt_unit: 'meter', alt_unit_conversion: 4, min_stock: 10,
                barcode: '8901234567890', description: 'Pipa PVC diameter 1/2 inch panjang 4 meter'
              },
              {
                code: 'PVC002', name: 'Pipa PVC 3/4"', category_id: 1,
                purchase_price: 22000, selling_price: 26000, stock: 30, unit: 'batang',
                alt_unit: 'meter', alt_unit_conversion: 4, min_stock: 10,
                barcode: '8901234567891', description: 'Pipa PVC diameter 3/4 inch panjang 4 meter'
              },
              {
                code: 'FIT001', name: 'Elbow PVC 1/2"', category_id: 2,
                purchase_price: 3000, selling_price: 4500, stock: 100, unit: 'pcs',
                alt_unit: null, alt_unit_conversion: 1, min_stock: 20,
                barcode: '8901234567893', description: 'Elbow PVC 90 derajat diameter 1/2 inch'
              }
            ];

            const insertQuery = `
              INSERT INTO products (
                code, name, category_id, purchase_price, selling_price,
                stock, unit, alt_unit, alt_unit_conversion, min_stock,
                barcode, description
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            let completed = 0;
            defaultProducts.forEach(product => {
              const values = [
                product.code, product.name, product.category_id,
                product.purchase_price, product.selling_price, product.stock,
                product.unit, product.alt_unit, product.alt_unit_conversion,
                product.min_stock, product.barcode, product.description
              ];

              db.run(insertQuery, values, (err) => {
                if (err) {
                  console.error('Error inserting default product:', err);
                }
                completed++;
                if (completed === defaultProducts.length) {
                  resolve();
                }
              });
            });
          } else {
            resolve();
          }
        });
      });
    });
  }
}

module.exports = Product; 