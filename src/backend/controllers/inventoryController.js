const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

class InventoryController {
  // Penerimaan Barang (Stock In)
  async penerimaanBarang(req, res) {
    try {
      const { items, supplier, invoice_number, notes, user } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Items tidak boleh kosong' });
      }

      const movements = [];

      for (const item of items) {
        const { product_id, quantity, unit_cost } = item;
        
        if (!product_id || !quantity || quantity <= 0) {
          return res.status(400).json({ 
            error: 'Setiap item harus memiliki product_id dan quantity yang valid' 
          });
        }

        const productId = parseInt(product_id);
        const product = await Product.getById(productId);
        if (!product) {
          return res.status(400).json({ 
            error: `Produk dengan ID ${product_id} tidak ditemukan` 
          });
        }

        const quantityBefore = product.stock;
        const quantityAfter = quantityBefore + quantity;

        // Update stok produk
        await Product.adjustStock(productId, quantity);

        // Update purchase_price jika unit_cost lebih tinggi dari yang ada
        if (unit_cost && unit_cost > 0) {
          const currentPurchasePrice = product.purchase_price || 0;
          if (unit_cost > currentPurchasePrice) {
            await Product.updatePurchasePrice(productId, unit_cost);
          }
        }

        // Catat pergerakan stok
        const movement = await StockMovement.create({
          product_id: productId,
          product_name: product.name,
          type: 'masuk',
          quantity,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          unit_cost: unit_cost || 0,
          total_cost: (unit_cost || 0) * quantity,
          reference_type: 'purchase',
          reference_id: invoice_number || null,
          notes: notes || `Penerimaan barang dari ${supplier || 'supplier'}`,
          user: user || 'Admin'
        });

        movements.push(movement);
      }

      res.json({
        success: true,
        message: `Berhasil mencatat penerimaan ${movements.length} item`,
        movements
      });
    } catch (error) {
      console.error('Error in penerimaanBarang:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Penyesuaian Stok (Stock Adjustment)
  async penyesuaianStok(req, res) {
    try {
      const { product_id, new_stock, reason, notes, user } = req.body;

      if (!product_id || new_stock === undefined) {
        return res.status(400).json({ 
          error: 'product_id dan new_stock harus diisi' 
        });
      }

      const productId = parseInt(product_id);
      const product = await Product.getById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Produk tidak ditemukan' });
      }

      const quantityBefore = product.stock;
      const quantityAfter = parseFloat(new_stock);
      const adjustment = quantityAfter - quantityBefore;

      if (adjustment === 0) {
        return res.status(400).json({ error: 'Tidak ada perubahan stok' });
      }

      // Update stok produk
      await Product.updateStock(productId, quantityAfter);

      // Catat pergerakan stok
      const movement = await StockMovement.create({
        product_id: productId,
        product_name: product.name,
        type: 'penyesuaian',
        quantity: Math.abs(adjustment),
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        unit_cost: 0,
        total_cost: 0,
        reference_type: 'adjustment',
        reference_id: null,
        notes: `${reason || 'Penyesuaian stok'}: ${notes || ''}`,
        user: user || 'Admin'
      });

      res.json({
        success: true,
        message: `Stok ${product.name} ${adjustment > 0 ? 'ditambah' : 'dikurangi'} ${Math.abs(adjustment)} ${product.unit}`,
        movement
      });
    } catch (error) {
      console.error('Error in penyesuaianStok:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Laporan Stok Menipis
  async laporanStokMenipis(req, res) {
    try {
      const products = await Product.getAll();
      
      const lowStockProducts = products.filter(product => {
        const minStock = product.min_stock || 0;
        return product.stock <= minStock;
      }).map(product => ({
        ...product,
        status: product.stock === 0 ? 'habis' : 'menipis',
        shortage: Math.max(0, (product.min_stock || 0) - product.stock)
      }));
      
      res.json({
        total: lowStockProducts.length,
        habis: lowStockProducts.filter(p => p.status === 'habis').length,
        menipis: lowStockProducts.filter(p => p.status === 'menipis').length,
        products: lowStockProducts
      });
    } catch (error) {
      console.error('Error in laporanStokMenipis:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Riwayat Pergerakan Stok
  async riwayatPergerakanStok(req, res) {
    try {
      const { product_id, type, start_date, end_date, limit = 50 } = req.query;

      let movements = await StockMovement.getAll();

      // Filter berdasarkan produk
      if (product_id) {
        movements = movements.filter(m => m.product_id === parseInt(product_id));
      }

      // Filter berdasarkan jenis pergerakan
      if (type) {
        movements = movements.filter(m => m.type === type);
      }

      // Filter berdasarkan tanggal
      if (start_date && end_date) {
        movements = await StockMovement.getByDateRange(start_date, end_date);
      }

      // Sort by created_at desc dan limit
      movements = movements
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, parseInt(limit));

      res.json({
        total: movements.length,
        movements
      });
    } catch (error) {
      console.error('Error in riwayatPergerakanStok:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Laporan Nilai Stok
  async laporanNilaiStok(req, res) {
    try {
      const products = await Product.getAll();
      
      const stockReport = products.map(product => {
        const stockValue = product.stock * (product.purchase_price || 0);
        const sellValue = product.stock * (product.selling_price || 0);
        
        return {
          id: product.id,
          code: product.code,
          name: product.name,
          category_name: product.category_name,
          stock: product.stock,
          unit: product.unit,
          purchase_price: product.purchase_price || 0,
          selling_price: product.selling_price || 0,
          stock_value: stockValue,
          potential_sell_value: sellValue,
          profit_potential: sellValue - stockValue
        };
      });

      const totalStockValue = stockReport.reduce((sum, item) => sum + item.stock_value, 0);
      const totalSellValue = stockReport.reduce((sum, item) => sum + item.potential_sell_value, 0);

      res.json({
        summary: {
          total_items: products.length,
          total_stock_value: totalStockValue,
          total_potential_sell_value: totalSellValue,
          total_profit_potential: totalSellValue - totalStockValue
        },
        details: stockReport
      });
    } catch (error) {
      console.error('Error in laporanNilaiStok:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Barang Rusak/Expired
  async barangRusak(req, res) {
    try {
      const { product_id, quantity, reason, notes, user } = req.body;

      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ 
          error: 'product_id dan quantity harus diisi dan valid' 
        });
      }

      const productId = parseInt(product_id);
      const product = await Product.getById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Produk tidak ditemukan' });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ 
          error: `Stok tidak mencukupi. Tersedia: ${product.stock}, diminta: ${quantity}` 
        });
      }

      const quantityBefore = product.stock;
      const quantityAfter = quantityBefore - quantity;

      // Update stok produk
      await Product.adjustStock(productId, -quantity);

      // Catat pergerakan stok
      const movement = await StockMovement.create({
        product_id: productId,
        product_name: product.name,
        type: reason === 'expired' ? 'expired' : 'rusak',
        quantity,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        unit_cost: product.purchase_price || 0,
        total_cost: (product.purchase_price || 0) * quantity,
        reference_type: 'damage',
        reference_id: null,
        notes: `${reason || 'Barang rusak'}: ${notes || ''}`,
        user: user || 'Admin'
      });

      res.json({
        success: true,
        message: `Berhasil mencatat ${quantity} ${product.unit} ${product.name} sebagai ${reason === 'expired' ? 'kadaluarsa' : 'rusak'}`,
        movement
      });
    } catch (error) {
      console.error('Error in barangRusak:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new InventoryController(); 