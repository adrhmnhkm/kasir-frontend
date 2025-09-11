const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Debug endpoint
router.get('/debug', async (req, res) => {
  try {
    const Sale = require('../models/Sale');
    const allSales = await Sale.getAll();
    
    res.json({
      total_sales: allSales.length,
      recent_sales: allSales.slice(0, 5),
      today_iso: new Date().toISOString(),
      today_local: new Date().toString(),
      query_params: req.query
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/sales - Get sales report
router.get('/sales', reportController.getSalesReport);

// GET /api/reports/products - Get products report
router.get('/products', reportController.getProductsReport);

// GET /api/reports/financial - Get financial report
router.get('/financial', reportController.getFinancialReport);

// GET /api/reports/inventory - Get inventory report
router.get('/inventory', reportController.getInventoryReport);

module.exports = router;
