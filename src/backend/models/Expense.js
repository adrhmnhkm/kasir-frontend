const db = require('../database/adapter');

class Expense {
  static async getAll() {
    try {
      const query = `
        SELECT * FROM expenses 
        WHERE is_active = true
        ORDER BY created_at DESC
      `;
      
      const result = await db.query(query, []);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const query = 'SELECT * FROM expenses WHERE id = $1 AND is_active = true';
      const result = await db.query(query, [id]);
      return result.rows?.[0] || result[0];
    } catch (error) {
      throw error;
    }
  }

  static async create(expenseData) {
    try {
      const query = `
        INSERT INTO expenses (
          description, amount, category, payment_method, 
          reference_number, notes, user
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
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
      
      const result = await db.query(query, values);
      const expenseId = result.insertId || result.rows?.[0]?.id;
      
      return await Expense.getById(expenseId);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, expenseData) {
    try {
      const query = `
        UPDATE expenses SET 
          description = $1, amount = $2, category = $3, payment_method = $4,
          reference_number = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
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
      
      await db.query(query, values);
      return await Expense.getById(id);
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'UPDATE expenses SET is_active = false WHERE id = $1';
      await db.query(query, [id]);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  static async getByCategory(category) {
    try {
      const query = `
        SELECT * FROM expenses 
        WHERE category = $1 AND is_active = true
        ORDER BY created_at DESC
      `;
      
      const result = await db.query(query, [category]);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  static async getByDateRange(startDate, endDate) {
    try {
      const query = `
        SELECT * FROM expenses 
        WHERE created_at BETWEEN $1 AND $2 AND is_active = true
        ORDER BY created_at DESC
      `;
      
      const result = await db.query(query, [startDate, endDate]);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  static async getSummary() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_expenses,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount,
          category,
          COUNT(*) as count
        FROM expenses 
        WHERE is_active = true
        GROUP BY category
        ORDER BY total_amount DESC
      `;
      
      const result = await db.query(query, []);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  static async getTotalByPeriod(startDate, endDate) {
    try {
      const query = `
        SELECT SUM(amount) as total_amount
        FROM expenses 
        WHERE created_at BETWEEN $1 AND $2 AND is_active = true
      `;
      
      const result = await db.query(query, [startDate, endDate]);
      return result.rows?.[0] || result[0];
    } catch (error) {
      throw error;
    }
  }

  // Get today's expenses
  static async getTodayExpenses() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
      
      const query = `
        SELECT * FROM expenses 
        WHERE created_at BETWEEN $1 AND $2 AND is_active = true
        ORDER BY created_at DESC
      `;
      
      const result = await db.query(query, [startOfDay, endOfDay]);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  // Get total expenses for a period
  static async getTotalExpenses(startDate, endDate) {
    try {
      const query = `
        SELECT SUM(amount) as total_amount
        FROM expenses 
        WHERE created_at BETWEEN $1 AND $2 AND is_active = true
      `;
      
      const result = await db.query(query, [startDate || '1900-01-01', endDate || '2099-12-31']);
      const row = result.rows?.[0] || result[0];
      return row ? row.total_amount || 0 : 0;
    } catch (error) {
      throw error;
    }
  }

  // Get expense summary by category
  static async getExpenseSummaryByCategory(startDate, endDate) {
    try {
      const query = `
        SELECT 
          category,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM expenses 
        WHERE created_at BETWEEN $1 AND $2 AND is_active = true
        GROUP BY category
        ORDER BY total_amount DESC
      `;
      
      const result = await db.query(query, [startDate || '1900-01-01', endDate || '2099-12-31']);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }

  // Get expense categories
  static async getExpenseCategories() {
    try {
      const query = `
        SELECT DISTINCT category
        FROM expenses 
        WHERE is_active = true
        ORDER BY category
      `;
      
      const result = await db.query(query, []);
      const rows = result.rows || result;
      return rows.map(row => row.category);
    } catch (error) {
      throw error;
    }
  }

  // Get expenses by date range (alias for getByDateRange)
  static async getExpensesByDateRange(startDate, endDate) {
    return await this.getByDateRange(startDate, endDate);
  }

  static async getByDateRange(startDate, endDate) {
    try {
      const query = `
        SELECT * FROM expenses 
        WHERE is_active = true 
          AND created_at >= ? 
          AND created_at <= ?
        ORDER BY created_at DESC
      `;
      
      const start = typeof startDate === 'string' ? startDate : startDate.toISOString();
      const end = typeof endDate === 'string' ? endDate : endDate.toISOString();
      
      const result = await db.query(query, [start, end]);
      return result.rows || result;
    } catch (error) {
      throw error;
    }
  }


  // Initialize expenses table
  static async initialize() {
    try {
      // First, try to check if table exists and has is_active column
      try {
        await db.query('SELECT is_active FROM expenses LIMIT 1', []);
        console.log('✅ Expenses table already exists with is_active column');
        return;
      } catch (e) {
        console.log('🔄 Expenses table needs to be fixed, recreating...');
      }

      // Drop and recreate table to ensure correct structure
      await db.query('DROP TABLE IF EXISTS expenses CASCADE', []);
      
      const createTableQuery = `
        CREATE TABLE expenses (
          id SERIAL PRIMARY KEY,
          description VARCHAR(255) NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          category VARCHAR(100) DEFAULT 'lainnya',
          payment_method VARCHAR(50) DEFAULT 'cash',
          reference_number VARCHAR(255),
          notes TEXT,
          user VARCHAR(255) DEFAULT 'Admin',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      
      await db.query(createTableQuery, []);
      console.log('✅ Expenses table recreated with correct structure');
    } catch (error) {
      console.error('❌ Error initializing expenses table:', error);
      throw error;
    }
  }
}

module.exports = Expense; 