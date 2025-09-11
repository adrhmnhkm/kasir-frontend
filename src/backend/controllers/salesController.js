const Sale = require('../models/Sale');
const Product = require('../models/Product');

class SalesController {
  async getAllSales(req, res) {
    try {
      const { 
        status, 
        start_date, 
        end_date, 
        period,
        draft,
        cashier,
        page = 1, 
        limit = 50 
      } = req.query;
      
      let sales;

      // Handle period filter (today, week, month)
      if (period) {
        const now = new Date();
        let startDate, endDate;

        if (period === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        } else if (period === 'week') {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
          weekStart.setHours(0, 0, 0, 0);
          startDate = weekStart;
          endDate = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000); // End of week
        } else if (period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }

        if (startDate && endDate) {
          const start = typeof startDate === 'string' ? startDate : startDate.toISOString();
          const end = typeof endDate === 'string' ? endDate : endDate.toISOString();
          sales = await Sale.getByDateRange(start, end);
        } else {
          sales = await Sale.getAll();
        }
      } else if (start_date && end_date) {
        // Custom date range
        sales = await Sale.getByDateRange(start_date, end_date);
      } else {
        sales = await Sale.getAll();
      }

      // Apply status filter
      if (status === 'draft' || draft === 'true') {
        sales = sales.filter(sale => sale.is_draft);
      } else if (status === 'completed') {
        sales = sales.filter(sale => !sale.is_draft);
      }

      // Apply cashier filter
      if (cashier) {
        sales = sales.filter(sale => 
          sale.cashier && sale.cashier.toLowerCase().includes(cashier.toLowerCase())
        );
      }

      // Sort by created_at descending
      sales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Apply pagination
      if (page && limit) {
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        sales = sales.slice(startIndex, endIndex);
      }

      res.json(sales);
    } catch (error) {
      console.error('Error in getAllSales:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getSaleById(req, res) {
    try {
      const { id } = req.params;
      const sale = await Sale.getById(parseInt(id));
      
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }
      
      res.json(sale);
    } catch (error) {
      console.error('Error in getSaleById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createSale(req, res) {
    try {
      const saleData = req.body;
      
      // Validate required fields
      if (!saleData.items || saleData.items.length === 0) {
        return res.status(400).json({ error: 'Sale must have at least one item' });
      }

      if (!saleData.total || parseFloat(saleData.total) <= 0) {
        return res.status(400).json({ error: 'Total must be greater than 0' });
      }

      // Validate items and check stock
      for (const item of saleData.items) {
        if (!item.product_id || !item.quantity || !item.unit_price) {
          return res.status(400).json({ 
            error: 'Each item must have product_id, quantity, and unit_price' 
          });
        }

        const product = await Product.getById(item.product_id);
        if (!product) {
          return res.status(400).json({ 
            error: `Product with ID ${item.product_id} not found` 
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${item.quantity}` 
          });
        }
      }

      const newSale = await Sale.create(saleData);
      res.status(201).json(newSale);
    } catch (error) {
      console.error('Error in createSale:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateSale(req, res) {
    try {
      const { id } = req.params;
      const saleData = req.body;
      
      const sale = await Sale.getById(parseInt(id));
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      const updatedSale = await Sale.update(parseInt(id), saleData);
      res.json(updatedSale);
    } catch (error) {
      console.error('Error in updateSale:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteSale(req, res) {
    try {
      const { id } = req.params;
      
      const sale = await Sale.getById(parseInt(id));
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      const result = await Sale.delete(parseInt(id));
      res.json({ success: true, message: 'Sale deleted successfully' });
    } catch (error) {
      console.error('Error in deleteSale:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async finalizeSale(req, res) {
    try {
      const { id } = req.params;
      
      const sale = await Sale.getById(parseInt(id));
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      if (!sale.is_draft) {
        return res.status(400).json({ error: 'Sale is already finalized' });
      }

      const finalizedSale = await Sale.finalize(parseInt(id));
      res.json(finalizedSale);
    } catch (error) {
      console.error('Error in finalizeSale:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getSalesSummary(req, res) {
    try {
      const summary = await Sale.getSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error in getSalesSummary:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SalesController(); 