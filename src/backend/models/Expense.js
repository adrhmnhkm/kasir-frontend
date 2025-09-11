const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use SQLite database
const dbPath = path.join(__dirname, '../../kasir.db');
const db = new sqlite3.Database(dbPath);

class Expense {
  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM expenses 
        WHERE is_active = 1
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

  static getById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM expenses WHERE id = ? AND is_active = 1';
      
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static create(expenseData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO expenses (
          description, amount, category, payment_method, 
          reference_number, notes, user
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        expenseData.description,
        parseFloat(expenseData.amount),
        expenseData.category || 'lainnya',
        expenseData.payment_method || 'cash',
        expenseData.reference_number || null,
        expenseData.notes || '',
        expenseData.user || 'Admin'
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

  static update(id, expenseData) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE expenses SET 
          description = ?, amount = ?, category = ?, payment_method = ?,
          reference_number = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const values = [
        expenseData.description,
        parseFloat(expenseData.amount),
        expenseData.category || 'lainnya',
        expenseData.payment_method || 'cash',
        expenseData.reference_number || null,
        expenseData.notes || '',
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
      const query = 'UPDATE expenses SET is_active = 0 WHERE id = ?';
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  static getByCategory(category) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM expenses 
        WHERE category = ? AND is_active = 1
        ORDER BY created_at DESC
      `;
      
      db.all(query, [category], (err, rows) => {
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
        SELECT * FROM expenses 
        WHERE created_at BETWEEN ? AND ? AND is_active = 1
        ORDER BY created_at DESC
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

  static getSummary() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_expenses,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount,
          category,
          COUNT(*) as count
        FROM expenses 
        WHERE is_active = 1
        GROUP BY category
        ORDER BY total_amount DESC
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

  static getTotalByPeriod(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT SUM(amount) as total_amount
        FROM expenses 
        WHERE created_at BETWEEN ? AND ? AND is_active = 1
      `;
      
      db.get(query, [startDate, endDate], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get today's expenses
  static getTodayExpenses() {
    return new Promise((resolve, reject) => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
      
      const query = `
        SELECT * FROM expenses 
        WHERE created_at BETWEEN ? AND ? AND is_active = 1
        ORDER BY created_at DESC
      `;
      
      db.all(query, [startOfDay, endOfDay], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get total expenses for a period
  static getTotalExpenses(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT SUM(amount) as total_amount
        FROM expenses 
        WHERE created_at BETWEEN ? AND ? AND is_active = 1
      `;
      
      db.get(query, [startDate || '1900-01-01', endDate || '2099-12-31'], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.total_amount || 0 : 0);
        }
      });
    });
  }

  // Get expense summary by category
  static getExpenseSummaryByCategory(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          category,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM expenses 
        WHERE created_at BETWEEN ? AND ? AND is_active = 1
        GROUP BY category
        ORDER BY total_amount DESC
      `;
      
      db.all(query, [startDate || '1900-01-01', endDate || '2099-12-31'], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get expense categories
  static getExpenseCategories() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT category
        FROM expenses 
        WHERE is_active = 1
        ORDER BY category
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.category));
        }
      });
    });
  }

  // Get expenses by date range (alias for getByDateRange)
  static getExpensesByDateRange(startDate, endDate) {
    return this.getByDateRange(startDate, endDate);
  }

  static getByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM expenses 
        WHERE is_active = 1 
          AND created_at >= ? 
          AND created_at <= ?
        ORDER BY created_at DESC
      `;
      
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

  // Initialize expenses table
  static async initialize() {
    return new Promise((resolve, reject) => {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL DEFAULT 'lainnya',
          payment_method TEXT DEFAULT 'cash',
          reference_number TEXT,
          notes TEXT,
          user TEXT DEFAULT 'Admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active INTEGER DEFAULT 1
        )
      `;
      
      db.run(createTableQuery, [], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Expenses table created/verified');
          resolve();
        }
      });
    });
  }
}

module.exports = Expense; 