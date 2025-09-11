const Product = require('../models/Product');
const Category = require('../models/Category');

class ProductController {
  async getAllProducts(req, res) {
    try {
      const { search, category, page = 1, limit = 50 } = req.query;
      
      let products;
      if (search || category) {
        products = await Product.search(search, category);
      } else {
        products = await Product.getAll();
      }

      // Apply pagination
      if (page && limit) {
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        products = products.slice(startIndex, endIndex);
      }

      res.json(products);
    } catch (error) {
      console.error('Error in getAllProducts:', error);
      res.status(500).json({ error: error.message });
    }
  }

    async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getById(parseInt(id));
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Error in getProductById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createProduct(req, res) {
    try {
      const productData = req.body;
      
      // Validate required fields
      const required = ['code', 'name', 'selling_price', 'unit'];
      const missing = required.filter(field => !productData[field]);
      
      if (missing.length > 0) {
        return res.status(400).json({ 
          error: `Missing required fields: ${missing.join(', ')}` 
        });
      }

      // Validate selling price
      if (parseFloat(productData.selling_price) <= 0) {
        return res.status(400).json({ 
          error: 'Selling price must be greater than 0' 
        });
      }

      // Check if code already exists
      const codeExists = await Product.existsByCode(productData.code);
      if (codeExists) {
        return res.status(409).json({ 
          error: `Product with code '${productData.code}' already exists` 
        });
      }

      // Check if barcode already exists
      if (productData.barcode) {
        const barcodeExists = await Product.existsByBarcode(productData.barcode);
        if (barcodeExists) {
          return res.status(409).json({ 
            error: `Product with barcode '${productData.barcode}' already exists` 
          });
        }
      }

      // Validate category if provided
      if (productData.category_id) {
        const category = await Category.getById(parseInt(productData.category_id));
        if (!category) {
          return res.status(400).json({ error: 'Invalid category' });
        }
      }

      const newProduct = await Product.create(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Error in createProduct:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const productData = req.body;
      
      const existingProduct = await Product.getById(parseInt(id));
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Validate selling price if provided
      if (productData.selling_price !== undefined && parseFloat(productData.selling_price) <= 0) {
        return res.status(400).json({ 
          error: 'Selling price must be greater than 0' 
        });
      }

      // Check if code already exists (excluding current product)
      if (productData.code && productData.code !== existingProduct.code && await Product.existsByCode(productData.code)) {
        return res.status(409).json({ 
          error: `Product with code '${productData.code}' already exists` 
        });
      }

      // Check if barcode already exists (excluding current product)
      if (productData.barcode && 
          productData.barcode !== existingProduct.barcode && 
          await Product.existsByBarcode(productData.barcode)) {
        return res.status(409).json({ 
          error: `Product with barcode '${productData.barcode}' already exists` 
        });
      }

      // Validate category if provided
      if (productData.category_id) {
        const category = await Category.getById(parseInt(productData.category_id));
        if (!category) {
          return res.status(400).json({ error: 'Invalid category' });
        }
      }

      const updatedProduct = await Product.update(parseInt(id), productData);
      
      // Add category name to response
      const categoryData = await Category.getById(updatedProduct.category_id);
      const productWithCategory = {
        ...updatedProduct,
        category_name: categoryData ? categoryData.name : null
      };

      res.json(productWithCategory);
    } catch (error) {
      console.error('Error in updateProduct:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getById(parseInt(id));
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if product has sales history
      // Use the proper delete method for soft delete
      const deleted = await Product.delete(parseInt(id));
      
      if (!deleted) {
        return res.status(500).json({ error: 'Failed to delete product' });
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getLowStockProducts(req, res) {
    try {
      const lowStockProducts = await Product.getLowStock();
      const productsWithCategory = await Promise.all(
        lowStockProducts.map(async (product) => {
          const categoryData = await Category.getById(product.category_id);
          return {
            ...product,
            category_name: categoryData ? categoryData.name : null
          };
        })
      );

      res.json(productsWithCategory);
    } catch (error) {
      console.error('Error in getLowStockProducts:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { stock, adjustment, reason } = req.body;
      
      const product = await Product.getById(parseInt(id));
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      let updatedProduct;
      
      if (stock !== undefined) {
        // Set absolute stock value
        updatedProduct = await Product.updateStock(parseInt(id), parseFloat(stock));
      } else if (adjustment !== undefined) {
        // Adjust stock by amount
        updatedProduct = await Product.adjustStock(parseInt(id), parseFloat(adjustment));
      } else {
        return res.status(400).json({ error: 'Either stock or adjustment must be provided' });
      }

      if (!updatedProduct) {
        return res.status(500).json({ error: 'Failed to update stock' });
      }

      // Add category name to response
      const categoryData = await Category.getById(updatedProduct.category_id);
      const productWithCategory = {
        ...updatedProduct,
        category_name: categoryData ? categoryData.name : null
      };

      res.json(productWithCategory);
    } catch (error) {
      console.error('Error in updateStock:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ProductController(); 