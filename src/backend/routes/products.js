const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const CodeGenerator = require('../utils/codeGenerator');
const Product = require('../models/Product');

// GET /api/products - Get all products with search and filter
router.get('/', productController.getAllProducts);

// GET /api/products/low-stock - Get low stock products
router.get('/low-stock', productController.getLowStockProducts);

// GET /api/products/:id - Get product by ID
router.get('/:id', productController.getProductById);

// POST /api/products - Create new product
router.post('/', productController.createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', productController.updateProduct);

// PUT /api/products/:id/stock - Update product stock
router.put('/:id/stock', productController.updateStock);

// DELETE /api/products/:id - Delete product (soft delete)
router.delete('/:id', productController.deleteProduct);

// Generate Product Code
router.post('/generate-code', async (req, res) => {
  try {
    const { category_id, type = 'sequential' } = req.body;
    
    if (!category_id) {
      return res.status(400).json({ error: 'category_id is required' });
    }

    const existingProducts = await Product.getAll();
    const existingCodes = existingProducts.map(p => p.code);
    
    // Get category info for better prefix generation
    const Category = require('../models/Category');
    const category = await Category.getById(parseInt(category_id));
    const categoryName = category ? category.name : null;
    const categoryPrefix = category ? category.prefix : null;
    
    let generatedCode;
    
    switch (type) {
      case 'sequential':
        generatedCode = await CodeGenerator.generateSequentialCode(parseInt(category_id), categoryName, existingCodes);
        break;
      case 'timestamp':
        generatedCode = await CodeGenerator.generateProductCode(parseInt(category_id), categoryName);
        break;
      default:
        generatedCode = await CodeGenerator.generateSequentialCode(parseInt(category_id), categoryName, existingCodes);
    }

    // Ensure uniqueness
    while (await Product.existsByCode(generatedCode)) {
      generatedCode = CodeGenerator.generateProductCode(parseInt(category_id));
    }

    res.json({
      code: generatedCode,
      type: type,
      category_id: category_id
    });
  } catch (error) {
    console.error('Error generating product code:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Barcode
router.post('/generate-barcode', async (req, res) => {
  try {
    const { format = 'EAN13' } = req.body;
    
    let generatedBarcode;
    
    switch (format) {
      case 'EAN13':
        generatedBarcode = CodeGenerator.generateEAN13Barcode();
        break;
      case 'CODE128':
        generatedBarcode = CodeGenerator.generateCode128();
        break;
      default:
        generatedBarcode = CodeGenerator.generateEAN13Barcode();
    }

    // Ensure uniqueness
    const existingProducts = await Product.getAll();
    while (existingProducts.some(p => p.barcode === generatedBarcode)) {
      generatedBarcode = CodeGenerator.generateEAN13Barcode();
    }

    // Validate generated barcode
    const isValid = CodeGenerator.validateBarcode(generatedBarcode, format);

    res.json({
      barcode: generatedBarcode,
      format: format,
      valid: isValid
    });
  } catch (error) {
    console.error('Error generating barcode:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Both Code and Barcode
router.post('/generate-both', async (req, res) => {
  try {
    const { category_id, code_type = 'sequential', barcode_format = 'EAN13' } = req.body;
    
    if (!category_id) {
      return res.status(400).json({ error: 'category_id is required' });
    }

    const existingProducts = await Product.getAll();
    const existingCodes = existingProducts.map(p => p.code);
    
    // Generate Code
    let generatedCode;
    switch (code_type) {
      case 'sequential':
        generatedCode = await CodeGenerator.generateSequentialCode(parseInt(category_id), null, existingCodes);
        break;
      case 'timestamp':
        generatedCode = await CodeGenerator.generateProductCode(parseInt(category_id));
        break;
      default:
        generatedCode = await CodeGenerator.generateSequentialCode(parseInt(category_id), null, existingCodes);
    }

    // Ensure code uniqueness
    while (await Product.existsByCode(generatedCode)) {
      generatedCode = CodeGenerator.generateProductCode(parseInt(category_id));
    }

    // Generate Barcode
    let generatedBarcode;
    switch (barcode_format) {
      case 'EAN13':
        generatedBarcode = CodeGenerator.generateEAN13Barcode();
        break;
      case 'CODE128':
        generatedBarcode = CodeGenerator.generateCode128();
        break;
      default:
        generatedBarcode = CodeGenerator.generateEAN13Barcode();
    }

    // Ensure barcode uniqueness
    while (existingProducts.some(p => p.barcode === generatedBarcode)) {
      generatedBarcode = CodeGenerator.generateEAN13Barcode();
    }

    res.json({
      code: generatedCode,
      barcode: generatedBarcode,
      code_type: code_type,
      barcode_format: barcode_format,
      barcode_valid: CodeGenerator.validateBarcode(generatedBarcode, barcode_format)
    });
  } catch (error) {
    console.error('Error generating code and barcode:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate Code/Barcode
router.post('/validate', async (req, res) => {
  try {
    const { code, barcode, exclude_id } = req.body;
    const result = { valid: true, errors: [] };

    if (code) {
      const existingProducts = await Product.getAll();
      const existingProduct = existingProducts.find(p => 
        p.code === code && (!exclude_id || p.id !== parseInt(exclude_id))
      );
      if (existingProduct) {
        result.valid = false;
        result.errors.push(`Kode produk '${code}' sudah digunakan oleh produk '${existingProduct.name}'`);
      }
    }

    if (barcode) {
      const existingProducts = await Product.getAll();
      const existingProduct = existingProducts.find(p => 
        p.barcode === barcode && (!exclude_id || p.id !== parseInt(exclude_id))
      );
      if (existingProduct) {
        result.valid = false;
        result.errors.push(`Barcode '${barcode}' sudah digunakan oleh produk '${existingProduct.name}'`);
      }

      // Validate barcode format
      if (!CodeGenerator.validateBarcode(barcode)) {
        result.valid = false;
        result.errors.push(`Format barcode '${barcode}' tidak valid`);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error validating code/barcode:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 