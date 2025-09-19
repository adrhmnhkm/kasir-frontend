import React from 'react';
import { formatCurrency } from '../../utils/currency';

const CartItem = ({ item, onUpdate, onRemove }) => {
  const handleQuantityChange = (value) => {
    const quantity = Math.max(0, parseFloat(value) || 0);
    if (quantity > item.stock) {
      return; // Don't allow more than available stock
    }
    onUpdate(item.id, 'quantity', quantity);
  };

  const handlePriceChange = (value) => {
    const price = Math.max(0, parseFloat(value) || 0);
    onUpdate(item.id, 'selling_price', price);
  };

  const handleDiscountChange = (value) => {
    const discount = Math.max(0, parseFloat(value) || 0);
    const maxDiscount = item.quantity * item.selling_price;
    
    if (discount > maxDiscount) {
      return; // Don't allow discount more than subtotal
    }
    
    onUpdate(item.id, 'discount', discount);
  };

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{item.name}</h4>
          <p className="text-xs text-gray-600">{item.code}</p>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-red-500 hover:text-red-700 ml-2"
        >
          <i className="fas fa-trash text-sm"></i>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {/* Quantity */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Qty</label>
          <input
            type="number"
            min="0"
            max={item.stock}
            value={item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="text-xs text-gray-500 mt-1">
            Stok: {item.stock} {item.unit}
          </div>
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Harga</label>
          <input
            type="number"
            min="0"
            value={item.selling_price}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Discount */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Diskon</label>
          <input
            type="number"
            min="0"
            max={item.quantity * item.selling_price}
            value={item.discount}
            onChange={(e) => handleDiscountChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Total */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Total</label>
          <div className="px-2 py-1 text-sm font-bold text-blue-600 bg-gray-50 rounded">
            {formatCurrency(item.total)}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {item.quantity > item.stock && (
        <div className="mt-2 text-xs text-red-600">
          <i className="fas fa-exclamation-triangle mr-1"></i>
          Quantity melebihi stok tersedia
        </div>
      )}
      
      {item.discount > (item.quantity * item.selling_price) && (
        <div className="mt-2 text-xs text-red-600">
          <i className="fas fa-exclamation-triangle mr-1"></i>
          Diskon melebihi subtotal
        </div>
      )}
    </div>
  );
};

// Make CartItem available globally
window.CartItem = CartItem; 
export default CartItem;