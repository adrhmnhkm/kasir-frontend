const { useState } = React;

const POSPage = ({ showNotification }) => {
  const [cashier, setCashier] = useState('Kasir');
  const [customer, setCustomer] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  
  const {
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary
  } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product);
    showNotification(`${product.name} ditambahkan ke keranjang`);
  };

  const triggerDataUpdates = () => {
    // Trigger events untuk update real-time di laporan dan halaman lain
    
    // For same tab
    window.dispatchEvent(new CustomEvent('salesUpdated'));
    window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    
    // For different tabs (localStorage events)
    localStorage.setItem('sales_updated', Date.now().toString());
    localStorage.setItem('inventory_updated', Date.now().toString());
    
    // Remove items immediately to trigger storage events
    setTimeout(() => {
      localStorage.removeItem('sales_updated');
      localStorage.removeItem('inventory_updated');
    }, 100);
  };

  const handleSaveDraft = async () => {
    if (cart.length === 0) {
      showNotification('Keranjang kosong', 'error');
      return;
    }

    try {
      const summary = getCartSummary();
      
      const saleData = {
        customer_id: null,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.selling_price,
          discount: item.discount,
          total: item.total
        })),
        subtotal: summary.subtotal,
        discount: summary.discount,
        tax: 0,
        total: summary.total,
        paid: 0,
        change_amount: 0,
        payment_method: 'cash',
        notes: customer,
        cashier: cashier,
        is_draft: true
      };

      const result = await api.sales.create(saleData);
      
      // Trigger update events untuk real-time updates
      triggerDataUpdates();
      
      showNotification(`Draft berhasil disimpan! Invoice: ${result.invoice_number}`);
      clearCart();
    } catch (error) {
      showNotification(`Error saving draft: ${error.message}`, 'error');
      console.error('Error saving draft:', error);
    }
  };

  const handleProceedPayment = () => {
    if (cart.length === 0) {
      showNotification('Keranjang kosong', 'error');
      return;
    }

    const validation = cart.some(item => item.quantity > item.stock);
    if (validation) {
      showNotification('Ada item yang melebihi stok tersedia', 'error');
      return;
    }

    setShowPayment(true);
  };

  const handlePayment = async (saleData) => {
    try {
      const result = await api.sales.create(saleData);
      
      // Trigger update events untuk real-time updates
      triggerDataUpdates();
      
      // Return the result to PaymentModal for print option
      return result;
    } catch (error) {
      showNotification(`Error processing payment: ${error.message}`, 'error');
      console.error('Error processing payment:', error);
      throw error;
    }
  };

  const handlePaymentSuccess = (result) => {
    showNotification(`Pembayaran berhasil! Invoice: ${result.invoice_number}`, 'success');
    clearCart();
    setShowPayment(false);
  };

  return (
    <div className="flex h-full">
      {/* Product Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Point of Sale</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Kasir:</label>
                <input
                  type="text"
                  value={cashier}
                  onChange={(e) => setCashier(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                  placeholder="Nama kasir"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Customer:</label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                  placeholder="Nama customer"
                />
              </div>
            </div>
          </div>
        </div>
        
        <ProductGrid onAddToCart={handleAddToCart} showNotification={showNotification} />
      </div>

      {/* Cart */}
      <div className="w-96 bg-white border-l">
        <Cart
          cart={cart}
          onUpdateItem={updateCartItem}
          onRemoveItem={removeFromCart}
          onClear={clearCart}
          cashier={cashier}
          onCashierChange={setCashier}
          customer={customer}
          onCustomerChange={setCustomer}
          onSaveDraft={handleSaveDraft}
          onProceedPayment={handleProceedPayment}
        />
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          cart={cart}
          cashier={cashier}
          customer={customer}
          onPayment={handlePayment}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

// Make POSPage available globally
window.POSPage = POSPage; 