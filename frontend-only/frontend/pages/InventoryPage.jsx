import React from 'react';
const { useState, useEffect } = React;

const InventoryPage = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState('stock');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    loadInventory();
    loadCategories();
  }, []);

  useEffect(() => {
    loadInventory();
  }, [searchTerm, selectedCategory]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      
      const data = await api.products.getAll(params);
      setProducts(data);
      
      // Filter low stock and out of stock products
      const lowStock = data.filter(p => p.stock <= (p.min_stock || 0) && p.stock > 0);
      const outOfStock = data.filter(p => p.stock <= 0);
      
      setLowStockProducts(lowStock);
      setOutOfStockProducts(outOfStock);
    } catch (error) {
      showNotification('Error loading inventory', 'error');
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (error) {
      showNotification('Error loading categories', 'error');
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setNewStock(product.stock.toString());
    setAdjustmentReason('');
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
    setNewStock('');
    setAdjustmentReason('');
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || !newStock || !adjustmentReason) {
      showNotification('Semua field harus diisi', 'error');
      return;
    }

    try {
      const result = await api.inventory.adjustStock({
        product_id: parseInt(selectedProduct.id),
        new_stock: parseFloat(newStock),
        reason: adjustmentReason,
        notes: `Penyesuaian melalui inventory management`,
        user: 'Admin'
      });

      showNotification(result.message || 'Stock berhasil disesuaikan');
      closeStockModal();
      loadInventory();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleBarcodeScan = (barcode) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      showNotification(`Produk ditemukan: ${product.name}`, 'success');
      // You can add more logic here like opening product details
    } else {
      showNotification('Produk tidak ditemukan', 'warning');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'stock'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Managemen Stok
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'alerts'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Peringatan Stok
          </button>
          <button
            onClick={() => setActiveTab('barcode')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'barcode'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Barcode Scanner
          </button>
        </div>
      </div>

      {/* Stock Management Tab */}
      {activeTab === 'stock' && (
        <div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Loading text="Memuat inventory..." />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok Saat Ini
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Min. Stok
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.code}</div>
                            {product.barcode && (
                              <div className="text-xs text-gray-400">
                                <i className="fas fa-barcode mr-1"></i>
                                {product.barcode}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`font-medium ${
                            product.stock <= 0 ? 'text-red-600' : 
                            product.stock <= (product.min_stock || 0) ? 'text-orange-600' : 'text-gray-900'
                          }`}>
                            {product.stock} {product.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.min_stock || 0} {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.stock <= 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <i className="fas fa-times-circle mr-1"></i>
                              Habis
                            </span>
                          ) : product.stock <= (product.min_stock || 0) ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <i className="fas fa-exclamation-triangle mr-1"></i>
                              Stok Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <i className="fas fa-check-circle mr-1"></i>
                              Tersedia
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openStockModal(product)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Sesuaikan stok"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Out of Stock Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-red-600">
                <i className="fas fa-times-circle mr-2"></i>
                Produk Habis ({outOfStockProducts.length})
              </h3>
            </div>
            <div className="p-6">
              {outOfStockProducts.length === 0 ? (
                <p className="text-gray-500 text-center">Tidak ada produk yang habis</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outOfStockProducts.map(product => (
                    <div key={product.id} className="p-4 border rounded-lg bg-red-50">
                      <div className="font-medium text-red-800">{product.name}</div>
                      <div className="text-sm text-red-600">{product.code}</div>
                      <div className="text-xs text-red-500 mt-1">
                        Stok: 0 {product.unit}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-orange-600">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Stok Menipis ({lowStockProducts.length})
              </h3>
            </div>
            <div className="p-6">
              {lowStockProducts.length === 0 ? (
                <p className="text-gray-500 text-center">Tidak ada produk dengan stok menipis</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="p-4 border rounded-lg bg-orange-50">
                      <div className="font-medium text-orange-800">{product.name}</div>
                      <div className="text-sm text-orange-600">{product.code}</div>
                      <div className="text-xs text-orange-500 mt-1">
                        Stok: {product.stock} {product.unit} (Min: {product.min_stock || 0})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Tab */}
      {activeTab === 'barcode' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Barcode Scanner</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scan Barcode atau Masukkan Manual
              </label>
              <input
                type="text"
                placeholder="Scan barcode atau ketik kode produk..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeScan(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Instruksi:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Hubungkan barcode scanner ke komputer</li>
                <li>• Scan barcode produk atau ketik kode manual</li>
                <li>• Sistem akan mencari produk dan menampilkan informasi</li>
                <li>• Tekan Enter untuk mencari produk</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && selectedProduct && (
        <Modal
          isOpen={showStockModal}
          onClose={closeStockModal}
          title="Penyesuaian Stok"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-600">Kode: {selectedProduct.code}</p>
              <p className="text-sm text-gray-600">Kategori: {selectedProduct.category_name || '-'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Stok Saat Ini:</span>
                <span className="text-lg font-bold text-blue-600">
                  {selectedProduct.stock} {selectedProduct.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stok Baru <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan stok baru"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Penyesuaian <span className="text-red-500">*</span>
              </label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih alasan</option>
                <option value="Stock Opname">Stock Opname</option>
                <option value="Koreksi Input">Koreksi Input</option>
                <option value="Kehilangan">Kehilangan</option>
                <option value="Kerusakan">Kerusakan</option>
                <option value="Expired">Expired</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {newStock && selectedProduct && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Perubahan: </span>
                  {parseFloat(newStock) - selectedProduct.stock > 0 ? (
                    <span className="text-green-600 font-semibold">
                      +{parseFloat(newStock) - selectedProduct.stock} {selectedProduct.unit}
                    </span>
                  ) : parseFloat(newStock) - selectedProduct.stock < 0 ? (
                    <span className="text-red-600 font-semibold">
                      {parseFloat(newStock) - selectedProduct.stock} {selectedProduct.unit}
                    </span>
                  ) : (
                    <span className="text-gray-600">Tidak ada perubahan</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={closeStockModal}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleStockAdjustment}
                disabled={!newStock || !adjustmentReason || parseFloat(newStock) === selectedProduct.stock}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Simpan Penyesuaian
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Make InventoryPage available globally
window.InventoryPage = InventoryPage;
