const db = require('../database/adapter');

class Category {
  static async getAll() {
    try {
      const query = `
        SELECT c.*, 
               COUNT(p.id) as product_count 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
        GROUP BY c.id 
        ORDER BY c.name
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in Category.getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const query = `
        SELECT c.*, 
               COUNT(p.id) as product_count 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
        WHERE c.id = $1
        GROUP BY c.id
      `;
      
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Category.getById:', error);
      throw error;
    }
  }

  static async existsByName(name) {
    try {
      const query = 'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)';
      const result = await db.query(query, [name]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error in Category.existsByName:', error);
      throw error;
    }
  }

  static async create(categoryData) {
    try {
      // Auto-generate prefix from category name
      const prefix = this.generatePrefixFromName(categoryData.name);
      
      const query = `
        INSERT INTO categories (name, description, prefix)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const result = await db.query(query, [
        categoryData.name, 
        categoryData.description || null, 
        prefix
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in Category.create:', error);
      throw error;
    }
  }

  // Auto-generate prefix from category name
  static generatePrefixFromName(categoryName) {
    if (!categoryName) return 'PRD';
    
    const name = categoryName.toUpperCase().trim();
    
    // Remove common words and get meaningful words
    const commonWords = ['DAN', 'ATAU', 'DENGAN', 'UNTUK', 'DARI', 'KE', 'DI', 'PADA'];
    const words = name.split(' ').filter(word => 
      word.length > 1 && !commonWords.includes(word)
    );
    
    if (words.length === 0) {
      return name.substring(0, 3);
    }
    
    // If single word, take first 3 letters
    if (words.length === 1) {
      return words[0].substring(0, 3);
    }
    
    // If multiple words, take first letter of each word
    if (words.length <= 3) {
      return words.map(word => word[0]).join('');
    }
    
    // If more than 3 words, take first 3 letters
    return words.slice(0, 3).map(word => word[0]).join('');
  }

  static async update(id, categoryData) {
    try {
      const query = `
        UPDATE categories 
        SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await db.query(query, [
        categoryData.name, 
        categoryData.description || null, 
        id
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Category.update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // First check if category has products
      const checkQuery = 'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND is_active = true';
      const checkResult = await db.query(checkQuery, [id]);
      
      if (checkResult.rows[0].count > 0) {
        throw new Error('Cannot delete category that has products');
      }
      
      // Delete the category
      const deleteQuery = 'DELETE FROM categories WHERE id = $1';
      const deleteResult = await db.query(deleteQuery, [id]);
      
      return deleteResult.changes > 0;
    } catch (error) {
      console.error('Error in Category.delete:', error);
      throw error;
    }
  }

  // Initialize categories table with default data
  static async initialize() {
    try {
      // Create table if not exists
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          prefix TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await db.query(createTableQuery);

      // Check if categories already exist
      const countResult = await db.query('SELECT COUNT(*) as count FROM categories');
      const count = parseInt(countResult.rows[0].count);

      if (count === 0) {
        // Insert default categories
        const defaultCategories = [
          { name: 'Pipa PVC', description: 'Pipa PVC berbagai ukuran' },
          { name: 'Fitting PVC', description: 'Fitting dan sambungan PVC' },
          { name: 'Pipa Galvanis', description: 'Pipa galvanis' },
          { name: 'Fitting Galvanis', description: 'Fitting galvanis' },
          { name: 'Semen', description: 'Semen berbagai merk' },
          { name: 'Cat', description: 'Cat tembok dan kayu' },
          { name: 'Alat', description: 'Peralatan dan tools' },
          { name: 'Tepung', description: 'Tepung berbagai jenis' },
          { name: 'Lain-lain', description: 'Produk lainnya' }
        ];

        for (const cat of defaultCategories) {
          const prefix = Category.generatePrefixFromName(cat.name);
          const insertQuery = 'INSERT INTO categories (name, description, prefix) VALUES ($1, $2, $3)';
          await db.query(insertQuery, [cat.name, cat.description, prefix]);
        }
      }
    } catch (error) {
      console.error('Error in Category.initialize:', error);
      throw error;
    }
  }
}

module.exports = Category; 