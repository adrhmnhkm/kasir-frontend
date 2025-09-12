const db = require('../database/adapter');

class Product {
  static async getAll() {
    try {
      const query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = 1
        ORDER BY p.name
      `;
      
      const result = await db.query(query, []);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ? AND p.is_active = 1
      `;
      
      const result = await db.query(query, [id]);
      return result.rows?.[0] || result[0];
    } catch (error) {
      throw error;
    }
  }

  static async existsByCode(code) {
    try {
      const query = 'SELECT id FROM products WHERE code = ? AND is_active = 1';
      const result = await db.query(query, [code]);
      return (result.rows || result).length > 0;
    } catch (error) {
      throw error;
    }
  }

  static async existsByBarcode(barcode) {
    try {
      const query = 'SELECT id FROM products WHERE barcode = ? AND is_active = 1';
      const result = await db.query(query, [barcode]);
      return (result.rows || result).length > 0;
    } catch (error) {
      throw error;
    }
  }

  static async create(productData) {
    try {
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
      
      const result = await db.query(query, values);
      const productId = result.insertId || result.rows?.[0]?.id;
      
      // Get the created product
      return await Product.getById(productId);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, productData) {
    try {
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
      
      const result = await db.query(query, values);
      
      if (result.changes === 0) {
        return null;
      }
      
      // Get the updated product
      return await Product.getById(id);
    } catch (error) {
      throw error;
    }
  }

  static async updateStock(id, newStock) {
    try {
      const query = `
        UPDATE products 
        SET stock = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      
      const result = await db.query(query, [parseFloat(newStock), id]);
      
      if (result.changes === 0) {
        return null;
      }
      
      // Get the updated product
      return await Product.getById(id);
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Soft delete - set is_active to 0
      const query = `
        UPDATE products 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      
      const result = await db.query(query, [id]);
      return result.changes > 0;
    } catch (error) {
      throw error;
    }
  }

  // Method khusus untuk update status
  static async updateStatus(id, isActive) {
    try {
      const query = `
        UPDATE products 
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const result = await db.query(query, [isActive ? 1 : 0, id]);
      return result.changes > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getLowStock() {
    try {
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
      
      const result = await db.query(query, []);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  static async search(searchTerm, categoryId) {
    try {
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

      const result = await db.query(query, params);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  // Adjust stock (add or subtract)
  static async adjustStock(productId, quantity) {
    try {
      const query = `
        UPDATE products 
        SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      
      const result = await db.query(query, [quantity, productId]);
      
      if (result.changes === 0) {
        throw new Error('Product not found or not active');
      }
      
      return { success: true, changes: result.changes };
    } catch (error) {
      throw error;
    }
  }

  // Update purchase price
  static async updatePurchasePrice(productId, purchasePrice) {
    try {
      const query = `
        UPDATE products 
        SET purchase_price = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      
      const result = await db.query(query, [purchasePrice, productId]);
      
      if (result.changes === 0) {
        throw new Error('Product not found or not active');
      }
      
      return { success: true, changes: result.changes };
    } catch (error) {
      throw error;
    }
  }

  // Initialize products table with default data (skip in production/Postgres)
  static async initialize() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
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

      await db.query(createTableQuery, []);

      // Check if products already exist
      const countResult = await db.query('SELECT COUNT(*) as count FROM products', []);
      const count = countResult.rows?.[0]?.count || countResult[0]?.count || 0;

      if (count === 0) {
        const defaultProducts = [];
        // Optionally seed here if needed
        console.log('✅ Products table is empty (dev). Skipping seed.');
      }

      console.log('✅ Products table initialized');
    } catch (error) {
      console.error('❌ Error initializing products table:', error);
      throw error;
    }
  }
}

module.exports = Product; 