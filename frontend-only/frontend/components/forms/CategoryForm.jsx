import React from 'react';
const { useState, useEffect } = React;

const CategoryForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingCategory = null, 
  showNotification 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        description: editingCategory.description || ''
      });
    } else {
      resetForm();
    }
  }, [editingCategory, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validation
      if (!formData.name || formData.name.trim() === '') {
        showNotification('Nama kategori wajib diisi', 'error');
        return;
      }

      let result;
      if (editingCategory) {
        result = await api.categories.update(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim()
        });
      } else {
        result = await api.categories.create({
          name: formData.name.trim(),
          description: formData.description.trim()
        });
      }

      showNotification(
        editingCategory ? 'Kategori berhasil diupdate' : 'Kategori berhasil ditambahkan'
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Kategori *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan nama kategori"
          />
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
            placeholder="Deskripsi kategori (opsional)"
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
            {editingCategory ? 'Update' : 'Simpan'}
          </LoadingButton>
        </div>
      </form>
    </Modal>
  );
};

// Make CategoryForm available globally
window.CategoryForm = CategoryForm; 