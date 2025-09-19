import React from 'react';
import Loading from '../common/Loading';
const CategoryTable = ({ categories, onEdit, onDelete, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <Loading />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <i className="fas fa-tags text-6xl text-gray-300 mb-4"></i>
        <h3 className="text-xl font-medium text-gray-600 mb-2">Belum Ada Kategori</h3>
        <p className="text-gray-500 mb-4">Mulai dengan menambahkan kategori produk pertama Anda</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deskripsi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jumlah Produk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dibuat
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <i className="fas fa-tag text-blue-600 text-sm"></i>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {category.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {category.product_count || 0} produk
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(category.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(category)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                      title="Edit kategori"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => onDelete(category.id)}
                      className={`p-1 transition-colors ${
                        category.product_count > 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-900'
                      }`}
                      title={
                        category.product_count > 0
                          ? 'Tidak dapat menghapus kategori yang memiliki produk'
                          : 'Hapus kategori'
                      }
                      disabled={category.product_count > 0}
                    >
                      <i className="fas fa-trash"></i>
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
          <span>
            Total: {categories.length} kategori
          </span>
          <span>
            Total produk: {categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Make CategoryTable available globally
window.CategoryTable = CategoryTable;

export default CategoryTable; 