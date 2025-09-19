import React from 'react';
const { useState, useEffect } = React;

const ExpenseForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingExpense = null, 
  categories = [],
  showNotification 
}) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    user: 'Admin'
  });
  const [loading, setLoading] = useState(false);

  const expenseCategories = [
    'operasional',
    'pembelian',
    'gaji',
    'transportasi',
    'listrik',
    'maintenance',
    'marketing',
    'administrasi',
    'lainnya'
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Transfer Bank' },
    { value: 'credit_card', label: 'Kartu Kredit' },
    { value: 'debit_card', label: 'Kartu Debit' },
    { value: 'check', label: 'Cek' },
    { value: 'other', label: 'Lainnya' }
  ];

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        description: editingExpense.description || '',
        amount: editingExpense.amount || '',
        category: editingExpense.category || '',
        payment_method: editingExpense.payment_method || 'cash',
        reference_number: editingExpense.reference_number || '',
        notes: editingExpense.notes || '',
        user: editingExpense.user || 'Admin'
      });
    } else {
      resetForm();
    }
  }, [editingExpense, isOpen]);

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: '',
      payment_method: 'cash',
      reference_number: '',
      notes: '',
      user: 'Admin'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validation
      if (!formData.description || formData.description.trim() === '') {
        showNotification('Deskripsi pengeluaran wajib diisi', 'error');
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        showNotification('Jumlah pengeluaran harus lebih dari 0', 'error');
        return;
      }

      if (!formData.category || formData.category.trim() === '') {
        showNotification('Kategori pengeluaran wajib dipilih', 'error');
        return;
      }

      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category: formData.category.trim(),
        notes: formData.notes.trim()
      };

      let result;
      if (editingExpense) {
        result = await api.expenses.update(editingExpense.id, submitData);
      } else {
        result = await api.expenses.create(submitData);
      }

      showNotification(
        editingExpense ? 'Pengeluaran berhasil diupdate' : 'Pengeluaran berhasil ditambahkan'
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

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const refNumber = `EXP${timestamp}${random}`;
    handleChange('reference_number', refNumber);
    showNotification('Nomor referensi berhasil digenerate');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi Pengeluaran *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Masukkan deskripsi pengeluaran"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Pilih Kategori</option>
              {expenseCategories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => handleChange('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Referensi
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => handleChange('reference_number', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Opsional"
              />
              <button
                type="button"
                onClick={generateReferenceNumber}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                title="Generate nomor referensi"
              >
                <i className="fas fa-random"></i>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User/Penanggung Jawab
            </label>
            <input
              type="text"
              value={formData.user}
              onChange={(e) => handleChange('user', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Nama user"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan
            </label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Catatan tambahan (opsional)"
            />
          </div>
        </div>

        {/* Summary */}
        {formData.amount && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Ringkasan Pengeluaran</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Pengeluaran:</span>
              <span className="text-lg font-bold text-red-600">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(parseFloat(formData.amount) || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-600">Kategori:</span>
              <span className="text-sm font-medium">
                {formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-600">Pembayaran:</span>
              <span className="text-sm font-medium">
                {paymentMethods.find(m => m.value === formData.payment_method)?.label || '-'}
              </span>
            </div>
          </div>
        )}

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
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            {editingExpense ? 'Update' : 'Simpan'}
          </LoadingButton>
        </div>
      </form>
    </Modal>
  );
};

// Make ExpenseForm available globally
window.ExpenseForm = ExpenseForm;

export default ExpenseForm;
