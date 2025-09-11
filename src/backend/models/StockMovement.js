const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use SQLite database
const dbPath = path.join(__dirname, '../../kasir.db');
const db = new sqlite3.Database(dbPath);

class StockMovement {
  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT sm.*, p.name as product_name, p.code as product_code
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        ORDER BY sm.created_at DESC
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
        SELECT sm.*, p.name as product_name, p.code as product_code
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        WHERE sm.id = ?
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

  static create(movementData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO stock_movements (
          product_id, product_name, type, quantity, quantity_before, 
          quantity_after, unit_cost, total_cost, reference_type, 
          reference_id, notes, user
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        movementData.product_id,
        movementData.product_name,
        movementData.type,
        parseFloat(movementData.quantity),
        parseFloat(movementData.quantity_before),
        parseFloat(movementData.quantity_after),
        parseFloat(movementData.unit_cost) || 0,
        parseFloat(movementData.total_cost) || 0,
        movementData.reference_type,
        movementData.reference_id,
        movementData.notes || '',
        movementData.user || 'System'
      ];
      
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.getById(this.lastID));
        }
      }.bind(this));
    });
  }

  static getByProductId(productId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT sm.*, p.name as product_name, p.code as product_code
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        WHERE sm.product_id = ?
        ORDER BY sm.created_at DESC
      `;
      
      db.all(query, [productId], (err, rows) => {
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
        SELECT sm.*, p.name as product_name, p.code as product_code
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        WHERE sm.created_at BETWEEN ? AND ?
        ORDER BY sm.created_at DESC
      `;
      
      db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getByType(type) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT sm.*, p.name as product_name, p.code as product_code
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        WHERE sm.type = ?
        ORDER BY sm.created_at DESC
      `;
      
      db.all(query, [type], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getSummary() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_movements,
          SUM(CASE WHEN type = 'masuk' THEN quantity ELSE 0 END) as total_in,
          SUM(CASE WHEN type = 'keluar' THEN quantity ELSE 0 END) as total_out,
          SUM(CASE WHEN type = 'masuk' THEN total_cost ELSE 0 END) as total_cost_in,
          SUM(CASE WHEN type = 'keluar' THEN total_cost ELSE 0 END) as total_cost_out
        FROM stock_movements
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

  // Initialize stock_movements table
  static async initialize() {
    return new Promise((resolve, reject) => {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          type TEXT NOT NULL,
          quantity REAL NOT NULL,
          quantity_before REAL NOT NULL,
          quantity_after REAL NOT NULL,
          unit_cost REAL DEFAULT 0,
          total_cost REAL DEFAULT 0,
          reference_type TEXT,
          reference_id INTEGER,
          notes TEXT,
          user TEXT DEFAULT 'System',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `;

      db.run(createTableQuery, [], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = StockMovement; 