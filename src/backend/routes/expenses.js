const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// GET /api/expenses - Get all expenses with filters
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      start_date, 
      end_date,
      page = 1, 
      limit = 50 
    } = req.query;
    
    let expenses = await Expense.getAll();

    // Apply category filter
    if (category) {
      expenses = await Expense.getByCategory(category);
    }

    // Apply date range filter
    if (start_date || end_date) {
      expenses = await Expense.getExpensesByDateRange(
        start_date || '1900-01-01', 
        end_date || '2099-12-31'
      );
    }

    // Sort by created_at descending
    expenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Apply pagination
    if (page && limit) {
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      expenses = expenses.slice(startIndex, endIndex);
    }

    res.json(expenses);
  } catch (error) {
    console.error('Error in getAllExpenses:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/expenses/summary - Get expense summary
router.get('/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const totalExpenses = await Expense.getTotalExpenses(start_date, end_date);
    const todayExpenses = await Expense.getTodayExpenses();
    const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const categoryBreakdown = await Expense.getExpenseSummaryByCategory(start_date, end_date);
    const expenseCategories = await Expense.getExpenseCategories();

    res.json({
      total_expenses: totalExpenses,
      today_expenses: todayTotal,
      today_transaction_count: todayExpenses.length,
      categories: expenseCategories,
      category_breakdown: categoryBreakdown
    });
  } catch (error) {
    console.error('Error in getExpenseSummary:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/expenses/today - Get today's expenses
router.get('/today', async (req, res) => {
  try {
    const todayExpenses = await Expense.getTodayExpenses();
    const totalAmount = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.json({
      expenses: todayExpenses,
      summary: {
        total_amount: totalAmount,
        total_transactions: todayExpenses.length,
        average_transaction: todayExpenses.length > 0 ? totalAmount / todayExpenses.length : 0
      }
    });
  } catch (error) {
    console.error('Error in getTodayExpenses:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/expenses/categories - Get expense categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Expense.getExpenseCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error in getExpenseCategories:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.getById(parseInt(id));
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    console.error('Error in getExpenseById:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/expenses - Create new expense
router.post('/', async (req, res) => {
  try {
    const { description, amount, category, notes } = req.body;
    
    // Validate required fields
    if (!description || description.trim() === '') {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (!category || category.trim() === '') {
      return res.status(400).json({ error: 'Category is required' });
    }

    const expenseData = {
      description: description.trim(),
      amount: parseFloat(amount),
      category: category.trim(),
      notes: notes ? notes.trim() : ''
    };

    const newExpense = await Expense.create(expenseData);
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error in createExpense:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, category, notes } = req.body;
    
    const existingExpense = await Expense.getById(parseInt(id));
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const updateData = {};
    
    if (description !== undefined) {
      if (description.trim() === '') {
        return res.status(400).json({ error: 'Description cannot be empty' });
      }
      updateData.description = description.trim();
    }

    if (amount !== undefined) {
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }
      updateData.amount = parseFloat(amount);
    }

    if (category !== undefined) {
      if (category.trim() === '') {
        return res.status(400).json({ error: 'Category cannot be empty' });
      }
      updateData.category = category.trim();
    }

    if (notes !== undefined) {
      updateData.notes = notes.trim();
    }

    const updatedExpense = await Expense.update(parseInt(id), updateData);
    res.json(updatedExpense);
  } catch (error) {
    console.error('Error in updateExpense:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.getById(parseInt(id));
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const deleted = await Expense.delete(parseInt(id));
    
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete expense' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error in deleteExpense:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 