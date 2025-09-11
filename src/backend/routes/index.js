const express = require('express');
const router = express.Router();

// Import route modules
const productsRoutes = require('./products');
const categoriesRoutes = require('./categories');
const salesRoutes = require('./sales');
const expensesRoutes = require('./expenses');
const inventoryRoutes = require('./inventory');
const reportsRoutes = require('./reports');

// Mount routes
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/sales', salesRoutes);
router.use('/expenses', expensesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportsRoutes);

// Settings endpoint
router.get('/settings', async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const settings = await Settings.getAll();
    
    // Map to expected format
    const formattedSettings = {
      store_name: settings.store_name || 'Toko Saya',
      store_address: settings.store_address || 'Jl. Contoh No. 123, Kota',
      store_phone: settings.store_phone || '081234567890',
      store_email: settings.store_email || 'info@tokosaya.com',
      tax_rate: parseFloat(settings.tax_rate) || 0.11,
      currency: settings.currency || 'IDR',
      receipt_footer: settings.receipt_footer || 'Terima kasih atas kunjungan Anda'
    };
    
    res.json(formattedSettings);
  } catch (error) {
    console.error('Error in getSettings:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const settings = req.body;
    
    // Update settings in database
    await Settings.updateMultiple(settings);
    
    // Return updated settings
    const updatedSettings = await Settings.getAll();
    res.json({
      ...updatedSettings,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in updateSettings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard summary endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const Sale = require('../models/Sale');
    const Expense = require('../models/Expense');
    const Product = require('../models/Product');
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    
    // Get data with individual error handling for debugging
    let todaySales, todayExpenses, lowStockProducts, draftSales;
    
    try {
      todaySales = await Sale.getByDateRange(startOfDay, endOfDay);
    } catch (error) {
      console.error('Error in Sale.getByDateRange:', error);
      throw error;
    }
    
    try {
      todayExpenses = await Expense.getByDateRange(startOfDay, endOfDay);
    } catch (error) {
      console.error('Error in Expense.getByDateRange:', error);
      throw error;
    }
    
    try {
      lowStockProducts = await Product.getLowStock();
    } catch (error) {
      console.error('Error in Product.getLowStock:', error);
      throw error;
    }
    
    try {
      draftSales = await Sale.getDrafts();
    } catch (error) {
      console.error('Error in Sale.getDrafts:', error);
      throw error;
    }
    
    const todaySalesTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const todayExpensesTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const todayProfit = todaySalesTotal - todayExpensesTotal;
    
    const summary = {
      today: {
        sales_total: todaySalesTotal,
        sales_count: todaySales.length,
        expenses_total: todayExpensesTotal,
        expenses_count: todayExpenses.length,
        profit: todayProfit
      },
      alerts: {
        low_stock_count: lowStockProducts.length,
        draft_sales_count: draftSales.length,
        low_stock_products: lowStockProducts.slice(0, 5) // Top 5 low stock
      },
      cash: {
        current_balance: 0, // Will be calculated from sales and expenses
        opening_balance: 0
      }
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error in getDashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

module.exports = router; 