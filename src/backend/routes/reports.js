const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// GET /api/reports/sales - Get sales report
router.get('/sales', reportController.getSalesReport);

// GET /api/reports/products - Get products report
router.get('/products', reportController.getProductsReport);

// GET /api/reports/financial - Get financial report
router.get('/financial', reportController.getFinancialReport);

// GET /api/reports/inventory - Get inventory report
router.get('/inventory', reportController.getInventoryReport);

module.exports = router;
