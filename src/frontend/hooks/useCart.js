const { useState } = React;

const useCart = () => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total: (item.quantity + 1) * item.selling_price - item.discount 
            }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        code: product.code,
        name: product.name,
        selling_price: product.selling_price,
        quantity: 1,
        discount: 0,
        total: product.selling_price,
        stock: product.stock,
        unit: product.unit
      }]);
    }
  };

  const updateCartItem = (id, field, value) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: parseFloat(value) || 0 };
        
        // Recalculate total
        if (field === 'quantity' || field === 'selling_price' || field === 'discount') {
          updatedItem.total = (updatedItem.quantity * updatedItem.selling_price) - updatedItem.discount;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

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

  const isInCart = (productId) => {
    return cart.some(item => item.id === productId);
  };

  const getCartItem = (productId) => {
    return cart.find(item => item.id === productId);
  };

  // Validate cart for checkout
  const validateCart = () => {
    const errors = [];
    
    if (cart.length === 0) {
      errors.push('Keranjang kosong');
      return { isValid: false, errors };
    }

    cart.forEach(item => {
      if (item.quantity <= 0) {
        errors.push(`Quantity ${item.name} harus lebih dari 0`);
      }
      
      if (item.quantity > item.stock) {
        errors.push(`Stok ${item.name} tidak mencukupi. Tersedia: ${item.stock}`);
      }
      
      if (item.selling_price <= 0) {
        errors.push(`Harga ${item.name} tidak valid`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const getCartSummary = () => {
    const subtotal = getCartSubtotal();
    const discount = getTotalDiscount();
    const total = getCartTotal();
    const itemCount = getItemCount();

    return {
      subtotal,
      discount,
      total,
      itemCount,
      tax: 0, // Tax is calculated on the backend
      taxAmount: 0
    };
  };

  return {
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSubtotal,
    getTotalDiscount,
    getCartTotal,
    getItemCount,
    isInCart,
    getCartItem,
    validateCart,
    getCartSummary
  };
};

// Make useCart available globally
window.useCart = useCart; 