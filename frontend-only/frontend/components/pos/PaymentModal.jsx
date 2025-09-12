const { useState, useEffect, useRef } = React;

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  cart, 
  cashier,
  customer,
  onPayment,
  onPaymentSuccess,
  showNotification 
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const paymentRef = useRef(null);

  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0);
  };

  const getTotalDiscount = () => {
    return cart.reduce((sum, item) => sum + item.discount, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const total = getCartTotal();
  const paid = parseFloat(paymentAmount) || 0;
  const change = paid - total;

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount(total.toString());
      setPaymentResult(null);
      setShowPrintOptions(false);
      // Focus on payment input when modal opens
      setTimeout(() => {
        if (paymentRef.current) {
          paymentRef.current.focus();
          paymentRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, total]);

  const handlePayment = async () => {
    if (cart.length === 0) {
      showNotification('Keranjang kosong', 'error');
      return;
    }

    if (paid < total) {
      showNotification('Pembayaran kurang dari total', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Get current time in Asia/Jakarta timezone - SIMPLIFIED
      const now = new Date();
      // Jakarta time is UTC+7
      const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      
      console.log('Jakarta time (UTC+7):', jakartaTime.toISOString());
      
      const saleData = {
        customer_id: null,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.selling_price,
          discount: item.discount,
          total: item.total
        })),
        subtotal: getCartSubtotal(),
        discount: getTotalDiscount(),
        tax: 0,
        total: total,
        paid: paid,
        change_amount: change,
        payment_method: 'cash',
        notes: customer,
        cashier: cashier,
        is_draft: false,
        created_at: jakartaTime.toISOString()
      };

      const result = await onPayment(saleData);
      
      // Set payment result and show print options
      setPaymentResult(result);
      setShowPrintOptions(true);
    } catch (error) {
      showNotification('Error processing payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showPrintOptions) {
      handlePayment();
    }
  };

  const addAmount = (amount) => {
    const newAmount = paid + amount;
    setPaymentAmount(newAmount.toString());
  };

  const handlePrintReceipt = () => {
    if (paymentResult) {
      // Open receipt modal instead of new window
      setShowReceiptModal(true);
    }
  };

  const handleSkipPrint = () => {
    handleFinishPayment();
  };

  const handleFinishPayment = () => {
    if (onPaymentSuccess && paymentResult) {
      onPaymentSuccess(paymentResult);
    }
  };

  const handleReceiptModalClose = () => {
    setShowReceiptModal(false);
    handleFinishPayment();
  };

  const quickAmounts = [50000, 100000, 200000, 500000];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={showPrintOptions ? "Pembayaran Berhasil" : "Pembayaran"}
        size="md"
      >
        <div className="space-y-4">
        {showPrintOptions ? (
          // Payment Success - Print Options
          <div className="text-center space-y-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-3xl text-green-600"></i>
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">
                Pembayaran Berhasil!
              </h3>
              <p className="text-green-700 mb-4">
                Invoice: {paymentResult?.invoice_number}
              </p>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Bayar:</span>
                  <span className="font-bold">{formatCurrency(paid)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Kembalian:</span>
                  <span className="font-bold text-green-600">{formatCurrency(change)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-lg font-medium text-gray-800">
                Apakah Anda ingin mencetak struk?
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePrintReceipt}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-print"></i>
                  <span>Cetak Struk</span>
                </button>
                
                <button
                  onClick={handleSkipPrint}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-times"></i>
                  <span>Skip</span>
                </button>
              </div>
              
              <p className="text-sm text-gray-500">
                Anda dapat mencetak struk nanti melalui menu Sales
              </p>
            </div>
          </div>
        ) : (
          // Payment Form
          <>
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Ringkasan Pesanan</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(getCartSubtotal())}</span>
            </div>
            <div className="flex justify-between">
              <span>Diskon:</span>
              <span className="text-red-600">-{formatCurrency(getTotalDiscount())}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jumlah Bayar
          </label>
          <input
            ref={paymentRef}
            type="number"
            min={total}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan jumlah bayar"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jumlah Cepat
          </label>
          <div className="grid grid-cols-2 gap-2">
            {quickAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => addAmount(amount)}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                +{formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        {/* Change */}
        {paid >= total && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-800">Kembalian:</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(change)}
              </span>
            </div>
          </div>
        )}

        {/* Payment insufficient warning */}
        {paid > 0 && paid < total && (
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center text-red-800">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <span className="text-sm">
                Pembayaran kurang {formatCurrency(total - paid)}
              </span>
            </div>
          </div>
        )}

        {/* Customer Info */}
        {customer && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Customer:</span> {customer}
          </div>
        )}

        {/* Cashier Info */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Kasir:</span> {cashier}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Batal
          </button>
          <LoadingButton
            loading={loading}
            onClick={handlePayment}
            disabled={paid < total}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-money-bill-wave mr-2"></i>
            Bayar Sekarang
          </LoadingButton>
        </div>
          </>
        )}
        </div>
      </Modal>

      {/* Receipt Modal */}
      {showReceiptModal && paymentResult && (
        <ReceiptModal 
          isOpen={showReceiptModal}
          onClose={handleReceiptModalClose}
          saleId={paymentResult.id}
        />
      )}
    </>
  );
};

// Make PaymentModal available globally
window.PaymentModal = PaymentModal; 