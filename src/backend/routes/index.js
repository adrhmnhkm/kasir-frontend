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
    
    // Get data with individual error handling for debugging - simplified
    let todaySales = [], todayExpenses = [], lowStockProducts = [], draftSales = [];
    
    console.log('Debug: startOfDay =', startOfDay, 'type:', typeof startOfDay);
    console.log('Debug: endOfDay =', endOfDay, 'type:', typeof endOfDay);
    
    try {
      todaySales = await Sale.getByDateRange(startOfDay, endOfDay);
      console.log('Debug: Sale.getByDateRange completed successfully');
    } catch (error) {
      console.error('Error in Sale.getByDateRange:', error);
      throw error;
    }
    
    // Comment out other calls for debugging
    // try {
    //   todayExpenses = await Expense.getByDateRange(startOfDay, endOfDay);
    // } catch (error) {
    //   console.error('Error in Expense.getByDateRange:', error);
    //   throw error;
    // }
    
    // try {
    //   lowStockProducts = await Product.getLowStock();
    // } catch (error) {
    //   console.error('Error in Product.getLowStock:', error);
    //   throw error;
    // }
    
    // try {
    //   draftSales = await Sale.getDrafts();
    // } catch (error) {
    //   console.error('Error in Sale.getDrafts:', error);
    //   throw error;
    // }
    
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

// Populate sample data endpoint (temporary)
router.post('/populate-sample-data', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const Category = require('../models/Category');
    
    // Sample categories
    const categories = [
      { name: 'Pipa PVC', description: 'Pipa PVC berbagai ukuran' },
      { name: 'Semen', description: 'Fitting PVC untuk sambungan' },
      { name: 'Sambungan', description: 'Sambungan dan perlengkapan' },
      { name: 'Katup', description: 'Katup dan valve' },
      { name: 'Perekat', description: 'Lem dan perekat' },
      { name: 'Lain-lain', description: 'Produk lainnya' }
    ];
    
    // Insert categories first
    for (const cat of categories) {
      await Category.create(cat);
    }
    
    // Sample products
    const products = [
      {
        code: 'PVC001',
        name: 'Pipa PVC 1/2"',
        category_id: 1,
        purchase_price: 15000,
        selling_price: 18000,
        stock: 50,
        unit: 'batang',
        alt_unit: 'meter',
        alt_unit_conversion: 4,
        min_stock: 10,
        barcode: '8901234567890',
        description: 'Pipa PVC diameter 1/2 inch panjang 4 meter'
      },
      {
        code: 'PVC002',
        name: 'Pipa PVC 3/4"',
        category_id: 1,
        purchase_price: 22000,
        selling_price: 26000,
        stock: 30,
        unit: 'batang',
        alt_unit: 'meter',
        alt_unit_conversion: 4,
        min_stock: 10,
        barcode: '8901234567891',
        description: 'Pipa PVC diameter 3/4 inch panjang 4 meter'
      },
      {
        code: 'PVC003',
        name: 'Pipa PVC 1"',
        category_id: 1,
        purchase_price: 35000,
        selling_price: 42000,
        stock: 25,
        unit: 'batang',
        alt_unit: 'meter',
        alt_unit_conversion: 4,
        min_stock: 8,
        barcode: '8901234567892',
        description: 'Pipa PVC diameter 1 inch panjang 4 meter'
      },
      {
        code: 'FIT001',
        name: 'Elbow PVC 1/2"',
        category_id: 2,
        purchase_price: 3000,
        selling_price: 4500,
        stock: 100,
        unit: 'pcs',
        min_stock: 20,
        barcode: '8901234567893',
        description: 'Elbow PVC 90 derajat diameter 1/2 inch'
      },
      {
        code: 'FIT002',
        name: 'Tee PVC 1/2"',
        category_id: 2,
        purchase_price: 4000,
        selling_price: 6000,
        stock: 80,
        unit: 'pcs',
        min_stock: 15,
        barcode: '8901234567894',
        description: 'Tee PVC diameter 1/2 inch'
      },
      {
        code: 'FIT003',
        name: 'Socket PVC 1/2"',
        category_id: 2,
        purchase_price: 2500,
        selling_price: 3500,
        stock: 120,
        unit: 'pcs',
        min_stock: 25,
        barcode: '8901234567895',
        description: 'Socket PVC diameter 1/2 inch'
      },
      {
        code: 'FIT004',
        name: 'Elbow PVC 3/4"',
        category_id: 2,
        purchase_price: 4500,
        selling_price: 6500,
        stock: 60,
        unit: 'pcs',
        min_stock: 15,
        barcode: '8901234567896',
        description: 'Elbow PVC 90 derajat diameter 3/4 inch'
      },
      {
        code: 'VAL001',
        name: 'Ball Valve 1/2"',
        category_id: 4,
        purchase_price: 25000,
        selling_price: 32000,
        stock: 20,
        unit: 'pcs',
        min_stock: 5,
        barcode: '8901234567897',
        description: 'Ball valve PVC diameter 1/2 inch'
      },
      {
        code: 'VAL002',
        name: 'Gate Valve 1/2"',
        category_id: 4,
        purchase_price: 18000,
        selling_price: 24000,
        stock: 15,
        unit: 'pcs',
        min_stock: 3,
        barcode: '8901234567898',
        description: 'Gate valve PVC diameter 1/2 inch'
      },
      {
        code: 'ADH001',
        name: 'Lem PVC 100ml',
        category_id: 5,
        purchase_price: 12000,
        selling_price: 15000,
        stock: 60,
        unit: 'botol',
        min_stock: 15,
        barcode: '8901234567899',
        description: 'Lem PVC kemasan 100ml'
      },
      {
        code: 'PVC004',
        name: 'Pipa PVC 1.5"',
        category_id: 1,
        purchase_price: 55000,
        selling_price: 68000,
        stock: 15,
        unit: 'batang',
        alt_unit: 'meter',
        alt_unit_conversion: 4,
        min_stock: 5,
        barcode: '8901234567900',
        description: 'Pipa PVC diameter 1.5 inch panjang 4 meter'
      },
      {
        code: 'PVC005',
        name: 'Pipa PVC 2"',
        category_id: 1,
        purchase_price: 75000,
        selling_price: 92000,
        stock: 12,
        unit: 'batang',
        alt_unit: 'meter',
        alt_unit_conversion: 4,
        min_stock: 4,
        barcode: '8901234567901',
        description: 'Pipa PVC diameter 2 inch panjang 4 meter'
      },
      {
        code: 'FIT005',
        name: 'Coupling PVC 1/2"',
        category_id: 2,
        purchase_price: 3500,
        selling_price: 5000,
        stock: 90,
        unit: 'pcs',
        min_stock: 20,
        barcode: '8901234567902',
        description: 'Coupling PVC diameter 1/2 inch'
      },
      {
        code: 'FIT006',
        name: 'Reducer PVC 3/4" x 1/2"',
        category_id: 2,
        purchase_price: 5000,
        selling_price: 7500,
        stock: 40,
        unit: 'pcs',
        min_stock: 10,
        barcode: '8901234567903',
        description: 'Reducer PVC dari 3/4 inch ke 1/2 inch'
      },
      {
        code: 'CAP001',
        name: 'Cap PVC 1/2"',
        category_id: 2,
        purchase_price: 2000,
        selling_price: 3000,
        stock: 150,
        unit: 'pcs',
        min_stock: 30,
        barcode: '8901234567904',
        description: 'Cap PVC diameter 1/2 inch'
      },
      {
        code: 'VLV003',
        name: 'Check Valve 1/2"',
        category_id: 4,
        purchase_price: 22000,
        selling_price: 28000,
        stock: 18,
        unit: 'pcs',
        min_stock: 5,
        barcode: '8901234567905',
        description: 'Check valve PVC diameter 1/2 inch'
      },
      {
        code: 'CLAMP01',
        name: 'Klem Pipa 1/2"',
        category_id: 6,
        purchase_price: 3500,
        selling_price: 5000,
        stock: 200,
        unit: 'pcs',
        min_stock: 50,
        barcode: '8901234567906',
        description: 'Klem pipa PVC diameter 1/2 inch'
      },
      {
        code: 'TAPE01',
        name: 'Isolasi Pipa',
        category_id: 6,
        purchase_price: 8000,
        selling_price: 12000,
        stock: 45,
        unit: 'roll',
        min_stock: 10,
        barcode: '8901234567907',
        description: 'Isolasi pipa warna putih'
      },
      {
        code: 'CLEAN01',
        name: 'Pembersih PVC',
        category_id: 5,
        purchase_price: 15000,
        selling_price: 20000,
        stock: 30,
        unit: 'botol',
        min_stock: 8,
        barcode: '8901234567908',
        description: 'Cairan pembersih PVC 250ml'
      },
      {
        code: 'FLEX01',
        name: 'Flexible Joint 1/2"',
        category_id: 3,
        purchase_price: 45000,
        selling_price: 58000,
        stock: 25,
        unit: 'pcs',
        min_stock: 6,
        barcode: '8901234567909',
        description: 'Sambungan fleksibel PVC 1/2 inch'
      }
    ];
    
    // Insert products
    for (const product of products) {
      await Product.create(product);
    }
    
    res.json({
      success: true,
      message: `Successfully populated ${categories.length} categories and ${products.length} products`,
      categories_count: categories.length,
      products_count: products.length
    });
    
  } catch (error) {
    console.error('Error populating sample data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 