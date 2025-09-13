const { useState, useEffect } = React;

const ReceiptPage = ({ saleId }) => {
  const [receiptData, setReceiptData] = useState(null);
  const [storeSettings, setStoreSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (saleId) {
      loadReceiptData();
      loadStoreSettings();
    }
  }, [saleId]);

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      const response = await api.sales.getById(saleId);
      setReceiptData(response);
    } catch (error) {
      console.error('Error loading receipt data:', error);
      setError('Gagal memuat data struk: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreSettings = async () => {
    try {
      const settings = await api.settings.get();
      setStoreSettings(settings);
    } catch (error) {
      console.error('Error loading store settings:', error);
      // Don't set error for settings failure
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data struk...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.close()} 
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <i className="fas fa-file-alt text-6xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">Data struk tidak ditemukan</p>
          <button 
            onClick={() => window.close()} 
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-10">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <i className="fas fa-print"></i>
          <span>Print</span>
        </button>
      </div>

      {/* Receipt Content */}
      <div className="receipt-container mx-auto p-4" style={{ width: '300px', fontFamily: 'Courier New, monospace', fontSize: '12px', lineHeight: '1.2' }}>
        
        {/* Header */}
        <div className="text-center border-b border-dashed border-black pb-2 mb-2">
          <div className="font-bold text-lg mb-1">
            {storeSettings.store_name || 'Aplikasi Kasir v1.0'}
          </div>
          <div className="text-xs mb-1">
            {storeSettings.store_address || 'Jl. Contoh No. 123, Kota'}
          </div>
          <div className="text-xs">
            {storeSettings.store_phone ? `Telp: ${storeSettings.store_phone}` : 'Telp: 021-12345678'}
          </div>
        </div>

        {/* Transaction Info */}
        <div className="mb-2 border-b border-dashed border-black pb-2">
          <div>No. Struk: {receiptData.invoice_number}</div>
          <div>Tanggal: {new Date(receiptData.created_at).toLocaleString('id-ID')}</div>
          <div>Kasir: {receiptData.cashier || 'Kasir'}</div>
        </div>

        {/* Items Header */}
        <div className="border-b border-solid border-black pb-1 mb-1 font-bold">
          <div className="flex justify-between">
            <span style={{ width: '60%' }}>Item</span>
            <span style={{ width: '15%', textAlign: 'center' }}>Qty</span>
            <span style={{ width: '25%', textAlign: 'right' }}>Harga</span>
          </div>
        </div>

        {/* Items List */}
        <div className="mb-2">
          {receiptData.items && receiptData.items.length > 0 ? (
            receiptData.items.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <div style={{ width: '60%' }}>{item.product_name}</div>
                  <div style={{ width: '15%', textAlign: 'center' }}>{item.quantity}</div>
                  <div style={{ width: '25%', textAlign: 'right' }}>{formatCurrency(item.total)}</div>
                </div>
                
                {/* Unit price and discount info */}
                <div className="text-xs text-gray-600 mb-1" style={{ fontSize: '10px', color: '#666' }}>
                  {item.discount > 0 ? (
                    <span>&nbsp;&nbsp;@ {formatCurrency(item.unit_price)} - Disc {formatCurrency(item.discount)}</span>
                  ) : (
                    <span>&nbsp;&nbsp;@ {formatCurrency(item.unit_price)}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-between">
              <span style={{ width: '60%' }}>Tidak ada item</span>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-black pt-1 mt-2">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>{formatCurrency(receiptData.subtotal)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Diskon:</span>
            <span>{formatCurrency(receiptData.discount)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-solid border-black pt-1 mt-1">
            <span>TOTAL:</span>
            <span>{formatCurrency(receiptData.total)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border-t border-dashed border-black pt-2 mt-2">
          <div className="flex justify-between mb-1">
            <span>Bayar:</span>
            <span>{formatCurrency(receiptData.paid)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kembali:</span>
            <span>{formatCurrency(receiptData.change_amount)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-dashed border-black pt-2 mt-3 text-xs">
          <div>Terima kasih atas kunjungan Anda</div>
          <div>Barang yang sudah dibeli tidak dapat dikembalikan</div>
          <div className="mt-2">*** STRUK ASLI ***</div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .receipt-container {
            width: auto !important;
            margin: 0 !important;
            padding: 10px !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// Make ReceiptPage available globally
window.ReceiptPage = ReceiptPage;
