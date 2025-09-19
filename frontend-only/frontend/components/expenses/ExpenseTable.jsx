import React from 'react';
import Loading from '../common/Loading';

const ExpenseTable = ({ 
  expenses, 
  onEdit, 
  onDelete,
  loading = false,
  formatCurrency,
  formatDate,
  getCategoryColor
}) => {
  if (loading) {
    return (
      <div className="p-8">
        <Loading text="Memuat data pengeluaran..." />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="p-8 text-center">
        <i className="fas fa-money-bill-wave text-6xl text-gray-400 mb-4"></i>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada pengeluaran</h3>
        <p className="text-gray-500">Belum ada data pengeluaran yang sesuai dengan filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deskripsi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jumlah
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metode Bayar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map(expense => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(expense.created_at)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{expense.description}</div>
                    {expense.reference_number && (
                      <div className="text-xs text-gray-500">
                        Ref: {expense.reference_number}
                      </div>
                    )}
                    {expense.notes && (
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                        {expense.notes}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                    {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <i className={`mr-2 ${getPaymentIcon(expense.payment_method)}`}></i>
                    {getPaymentLabel(expense.payment_method)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {expense.user || 'Admin'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(expense)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="Edit pengeluaran"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Hapus pengeluaran"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    <button
                      onClick={() => downloadReceipt(expense)}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                      title="Download bukti"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total: {expenses.length} pengeluaran</span>
          <span className="font-medium text-red-600">
            Total Pengeluaran: {formatCurrency(expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getPaymentIcon = (method) => {
  const icons = {
    'cash': 'fas fa-money-bill-wave text-green-500',
    'bank_transfer': 'fas fa-university text-blue-500',
    'credit_card': 'fas fa-credit-card text-purple-500',
    'debit_card': 'fas fa-credit-card text-orange-500',
    'check': 'fas fa-money-check text-indigo-500',
    'other': 'fas fa-question-circle text-gray-500'
  };
  return icons[method] || icons['other'];
};

const getPaymentLabel = (method) => {
  const labels = {
    'cash': 'Cash',
    'bank_transfer': 'Transfer Bank',
    'credit_card': 'Kartu Kredit',
    'debit_card': 'Kartu Debit',
    'check': 'Cek',
    'other': 'Lainnya'
  };
  return labels[method] || 'Lainnya';
};

const downloadReceipt = (expense) => {
  // Create a simple receipt content
  const receiptContent = `
BUKTI PENGELUARAN
==================

Tanggal: ${new Date(expense.created_at).toLocaleDateString('id-ID')}
Deskripsi: ${expense.description}
Kategori: ${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
Jumlah: ${new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(expense.amount)}
Metode Bayar: ${getPaymentLabel(expense.payment_method)}
${expense.reference_number ? `Ref: ${expense.reference_number}` : ''}
User: ${expense.user || 'Admin'}
${expense.notes ? `Catatan: ${expense.notes}` : ''}

==================
Aplikasi Kasir PVC
  `;

  // Create and download file
  const blob = new Blob([receiptContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `expense_${expense.id}_${new Date(expense.created_at).toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Make ExpenseTable available globally
window.ExpenseTable = ExpenseTable;

export default ExpenseTable;
