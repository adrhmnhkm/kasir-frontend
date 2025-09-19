import React from 'react';
import { formatCurrency } from '../../utils/currency';
const ProductTable = ({ 
  products, 
  onEdit, 
  onDelete,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <i className="fas fa-box-open text-6xl text-gray-400 mb-4"></i>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada produk</h3>
        <p className="text-gray-500">Belum ada produk yang ditambahkan atau sesuai dengan filter.</p>
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
                Kode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Produk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Beli
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Jual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div>
                    <div className="font-medium">{product.code}</div>
                    {product.barcode && (
                      <div className="text-xs text-gray-500">
                        <i className="fas fa-barcode mr-1"></i>
                        {product.barcode}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {product.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.category_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.purchase_price ? formatCurrency(product.purchase_price) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="font-medium text-green-600">
                    {formatCurrency(product.selling_price)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span className={`font-medium ${
                      product.stock <= (product.min_stock || 0) 
                        ? product.stock <= 0 ? 'text-red-600' : 'text-orange-600'
                        : 'text-gray-900'
                    }`}>
                      {product.stock} {product.unit}
                    </span>
                    {product.stock <= (product.min_stock || 0) && (
                      <span className="text-xs text-red-500">
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        {product.stock <= 0 ? 'Habis' : 'Stok menipis'}
                      </span>
                    )}
                    {product.alt_unit && (
                      <span className="text-xs text-gray-500">
                        ({Math.floor(product.stock / (product.alt_unit_conversion || 1))} {product.alt_unit})
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="Edit produk"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Hapus produk"
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
          <span>Total: {products.length} produk</span>
          <span>
            Stok menipis: {products.filter(p => p.stock <= (p.min_stock || 0) && p.stock > 0).length} | 
            Habis: {products.filter(p => p.stock <= 0).length}
          </span>
        </div>
      </div>
    </div>
  );
};

// Make ProductTable available globally
window.ProductTable = ProductTable;

export default ProductTable; 