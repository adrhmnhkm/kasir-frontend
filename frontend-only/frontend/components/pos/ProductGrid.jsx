import React from 'react';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import Loading from '../common/Loading';

const { useState, useEffect, useRef } = React;

const ProductGrid = ({ 
  onAddToCart, 
  showNotification,
  className = '' 
}) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const searchRef = useRef(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
    // Focus on search input
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.getAll({ 
        search: searchTerm, 
        category: selectedCategory 
      });
      setProducts(data);
    } catch (error) {
      showNotification('Error loading products', 'error');
      console.error('Error loading products:', error);
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
      console.error('Error loading categories:', error);
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      showNotification(`Stok ${product.name} habis`, 'warning');
      return;
    }
    
    onAddToCart(product);
    
    // Clear search after adding
    setSearchTerm('');
    if (searchRef.current) {
      searchRef.current.focus();
    }
  };

  // Handle barcode scanner input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchTerm) {
      // Try to find product by barcode first, then by search
      const product = products.find(p => 
        p.barcode === searchTerm || 
        p.code === searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (product) {
        handleAddToCart(product);
      } else {
        showNotification('Produk tidak ditemukan', 'warning');
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Search and Filter Header */}
      <div className="p-4 border border-gray-200">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              ref={searchRef}
              type="text"
              placeholder="Cari produk atau scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="p-4 h-96 overflow-y-auto custom-scrollbar">
        {loading ? (
          <Loading text="Memuat produk..." />
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <i className="fas fa-box-open text-4xl mb-4"></i>
            <p>Tidak ada produk ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map(product => (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className={`p-4 border border-gray-200 rounded-lg cursor-pointer transition-colors ${
                  product.stock <= 0 
                    ? 'bg-gray-100 border border-gray-300 cursor-not-allowed opacity-50'
                    : 'hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-sm">{product.name}</div>
                <div className="text-xs text-gray-600 mb-2">{product.code}</div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(product.selling_price)}
                  </span>
                  <span className={`text-xs ${product.stock <= 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    Stok: {product.stock} {product.unit}
                  </span>
                </div>
                {product.stock <= product.min_stock && product.stock > 0 && (
                  <div className="mt-1 text-xs text-orange-600">
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                    Stok menipis
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



export default ProductGrid; 