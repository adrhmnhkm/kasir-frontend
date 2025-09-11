const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// GET /api/sales - Get all sales with filters
router.get('/', salesController.getAllSales);

// GET /api/sales/summary - Get sales summary
router.get('/summary', salesController.getSalesSummary);

// GET /api/sales/:id - Get sale by ID
router.get('/:id', salesController.getSaleById);

// POST /api/sales - Create new sale
router.post('/', salesController.createSale);

// PUT /api/sales/:id - Update sale
router.put('/:id', salesController.updateSale);

// PUT /api/sales/:id/finalize - Finalize draft sale
router.put('/:id/finalize', salesController.finalizeSale);

// DELETE /api/sales/:id - Delete sale
router.delete('/:id', salesController.deleteSale);

module.exports = router; 