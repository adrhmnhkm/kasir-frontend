import React from 'react';
const Cart = ({ 
  cart, 
  onUpdateItem, 
  onRemoveItem, 
  onClear,
  cashier,
  onCashierChange,
  customer,
  onCustomerChange,
  onSaveDraft,
  onProceedPayment,
  className = ''
}) => {
  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0);
  };

  const getTotalDiscount = () => {
    return cart.reduce((sum, item) => sum + item.discount, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className={`bg-white rounded-lg shadow flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Keranjang Belanja</h3>
        <div className="grid grid-cols-1 gap-2 mt-3">
          <input
            type="text"
            placeholder="Nama kasir"
            value={cashier}
            onChange={(e) => onCashierChange(e.target.value)}
            className="px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Customer (opsional)"
            value={customer}
            onChange={(e) => onCustomerChange(e.target.value)}
            className="px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Items */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {cart.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <i className="fas fa-shopping-cart text-4xl mb-4"></i>
            <p>Keranjang kosong</p>
            <p className="text-sm">Pilih produk untuk menambah ke keranjang</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdate={onUpdateItem}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Summary & Actions */}
      {cart.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          {/* Totals */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Items:</span>
              <span>{getItemCount()} item(s)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(getCartSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Diskon:</span>
              <span className="text-red-600">-{formatCurrency(getTotalDiscount())}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">{formatCurrency(getCartTotal())}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={onSaveDraft}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              <i className="fas fa-save mr-2"></i>
              Draft
            </button>
            
            <button
              onClick={onProceedPayment}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <i className="fas fa-calculator mr-2"></i>
              Bayar
            </button>
          </div>
          
          <button
            onClick={onClear}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            <i className="fas fa-trash mr-2"></i>
            Bersihkan
          </button>
        </div>
      )}
    </div>
  );
};

// Make Cart available globally
window.Cart = Cart; 