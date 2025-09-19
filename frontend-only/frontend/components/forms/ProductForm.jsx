import React from 'react';
const { useState, useEffect } = React;
import Modal from '../common/Modal';
import LoadingButton from '../common/LoadingButton';
import CategoryForm from './CategoryForm';
import { api } from '../../utils/api';

const ProductForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingProduct = null, 
  categories = [],
  showNotification,
  onCategoryUpdate
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: '',
    purchase_price: '',
    selling_price: '',
    stock: '',
    unit: '',
    alt_unit: '',
    alt_unit_conversion: '1',
    min_stock: '0',
    barcode: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        code: editingProduct.code,
        name: editingProduct.name,
        category_id: editingProduct.category_id || '',
        purchase_price: editingProduct.purchase_price,
        selling_price: editingProduct.selling_price,
        stock: editingProduct.stock,
        unit: editingProduct.unit,
        alt_unit: editingProduct.alt_unit || '',
        alt_unit_conversion: editingProduct.alt_unit_conversion || '1',
        min_stock: editingProduct.min_stock || '0',
        barcode: editingProduct.barcode || '',
        description: editingProduct.description || ''
      });
    } else {
      resetForm();
    }
  }, [editingProduct, isOpen]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category_id: '',
      purchase_price: '',
      selling_price: '',
      stock: '',
      unit: '',
      alt_unit: '',
      alt_unit_conversion: '1',
      min_stock: '0',
      barcode: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validation
      if (!formData.code || !formData.name || !formData.selling_price || !formData.unit) {
        showNotification('Mohon lengkapi field yang wajib diisi', 'error');
        return;
      }

      if (parseFloat(formData.selling_price) <= 0) {
        showNotification('Harga jual harus lebih dari 0', 'error');
        return;
      }

      let result;
      if (editingProduct) {
        result = await api.products.update(editingProduct.id, formData);
      } else {
        result = await api.products.create(formData);
      }

      showNotification(
        editingProduct ? 'Produk berhasil diupdate' : 'Produk berhasil ditambahkan'
      );
      
      onSave(result);
      onClose();
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateCode = async () => {
    if (!formData.category_id) {
      showNotification('Pilih kategori terlebih dahulu untuk generate kode', 'error');
      return;
    }

    try {
      setGeneratingCode(true);
      const result = await api.products.generateCode({
        category_id: formData.category_id,
        type: 'sequential'
      });
      handleChange('code', result.code);
      showNotification('Kode produk berhasil digenerate');
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleGenerateBarcode = async () => {
    try {
      setGeneratingBarcode(true);
      const result = await api.products.generateBarcode({
        format: 'EAN13'
      });
      handleChange('barcode', result.barcode);
      showNotification('Barcode berhasil digenerate');
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setGeneratingBarcode(false);
    }
  };

  const handleCategorySave = () => {
    if (onCategoryUpdate) {
      onCategoryUpdate();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? 'Edit Produk' : 'Tambah Produk'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Produk *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan kode produk"
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={generatingCode || !formData.category_id}
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Generate kode produk otomatis"
              >
                {generatingCode ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-magic"></i>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Produk *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan nama produk"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <div className="flex gap-2">
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                title="Tambah kategori baru"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan barcode"
              />
              <button
                type="button"
                onClick={handleGenerateBarcode}
                disabled={generatingBarcode}
                className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Generate barcode otomatis"
              >
                {generatingBarcode ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-barcode"></i>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga Beli
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.purchase_price}
              onChange={(e) => handleChange('purchase_price', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga Jual *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.selling_price}
              onChange={(e) => handleChange('selling_price', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stok
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satuan *
            </label>
            <input
              type="text"
              required
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              placeholder="pcs, meter, kg, dll"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min. Stok
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.min_stock}
              onChange={(e) => handleChange('min_stock', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satuan Alternatif
            </label>
            <input
              type="text"
              value={formData.alt_unit}
              onChange={(e) => handleChange('alt_unit', e.target.value)}
              placeholder="batang, lusin, dll"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konversi (1 alt unit = ? unit utama)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.alt_unit_conversion}
              onChange={(e) => handleChange('alt_unit_conversion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi
          </label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Deskripsi produk..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            disabled={loading}
          >
            Batal
          </button>
          <LoadingButton
            loading={loading}
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {editingProduct ? 'Update' : 'Simpan'}
          </LoadingButton>
        </div>
      </form>

      {/* Quick Add Category Modal */}
      <CategoryForm
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSave={handleCategorySave}
        showNotification={showNotification}
      />
    </Modal>
  );
};

// Make ProductForm available globally
window.ProductForm = ProductForm; 
export default ProductForm;