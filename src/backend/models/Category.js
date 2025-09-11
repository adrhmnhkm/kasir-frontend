const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use SQLite database
const dbPath = path.join(__dirname, '../../kasir.db');
const db = new sqlite3.Database(dbPath);

class Category {
  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT c.*, 
               COUNT(p.id) as product_count 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
        GROUP BY c.id 
        ORDER BY c.name
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
        SELECT c.*, 
               COUNT(p.id) as product_count 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
        WHERE c.id = ?
        GROUP BY c.id
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

  static existsByName(name) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)';
      
      db.get(query, [name], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }

  static create(categoryData) {
    return new Promise((resolve, reject) => {
      // Auto-generate prefix from category name
      const prefix = this.generatePrefixFromName(categoryData.name);
      
      const query = `
        INSERT INTO categories (name, description, prefix)
        VALUES (?, ?, ?)
      `;
      
      db.run(query, [categoryData.name, categoryData.description || null, prefix], function(err) {
        if (err) {
          reject(err);
        } else {
          // Get the created category
          Category.getById(this.lastID)
            .then(category => resolve(category))
            .catch(reject);
        }
      });
    });
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

  static update(id, categoryData) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE categories 
        SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.run(query, [categoryData.name, categoryData.description || null, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          // Get the updated category
          Category.getById(id)
            .then(category => resolve(category))
            .catch(reject);
        }
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      // First check if category has products
      const checkQuery = 'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1';
      
      db.get(checkQuery, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row.count > 0) {
          reject(new Error('Cannot delete category that has products'));
          return;
        }
        
        // Delete the category
        const deleteQuery = 'DELETE FROM categories WHERE id = ?';
        db.run(deleteQuery, [id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        });
      });
    });
  }

  // Initialize categories table with default data
  static async initialize() {
    return new Promise((resolve, reject) => {
      // Create table if not exists
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          prefix TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      db.run(createTableQuery, [], (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Ensure prefix column exists (for existing databases)
        db.run('ALTER TABLE categories ADD COLUMN prefix TEXT;', [], (err) => {
          // Ignore error if column already exists
          if (err && !err.message.includes('duplicate column name')) {
            console.warn('Warning: Could not add prefix column:', err.message);
          }
        });

        // Check if categories already exist
        db.get('SELECT COUNT(*) as count FROM categories', [], (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row.count === 0) {
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

            const insertQuery = 'INSERT INTO categories (name, description, prefix) VALUES (?, ?, ?)';
            let completed = 0;

            defaultCategories.forEach(cat => {
              const prefix = Category.generatePrefixFromName(cat.name);
              db.run(insertQuery, [cat.name, cat.description, prefix], (err) => {
                if (err) {
                  console.error('Error inserting default category:', err);
                }
                completed++;
                if (completed === defaultCategories.length) {
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

module.exports = Category; 