const { useState, useEffect } = React;

const ReceiptModal = ({ isOpen, onClose, saleId }) => {
  // Force alert to show component is loading
  alert('RECEIPT MODAL LOADED - Props: ' + JSON.stringify({ isOpen, saleId }));
  
  const [receiptData, setReceiptData] = useState(null);
  const [storeSettings, setStoreSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    alert('RECEIPT MODAL USEEFFECT - isOpen: ' + isOpen + ', saleId: ' + saleId);
    
    if (isOpen && saleId) {
      alert('LOADING RECEIPT DATA...');
      loadReceiptData();
      loadStoreSettings();
    }
  }, [isOpen, saleId]);

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.sales.getById(saleId);
      
      // Debug data yang diterima
      console.log('=== RECEIPT DATA LOADED ===');
      console.log('Sale ID:', saleId);
      console.log('Response:', response);
      console.log('Created At:', response.created_at);
      console.log('Invoice Number:', response.invoice_number);
      alert(`RECEIPT DATA LOADED:\nSale ID: ${saleId}\nCreated At: ${response.created_at}\nInvoice: ${response.invoice_number}`);
      
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
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatJakartaTime = (dateString) => {
    if (!dateString) return '-';
  
    // Create Date object from UTC string
    const dateUTC = new Date(dateString);
  
    // Manually add 7 hours offset for Jakarta (UTC+7)
    const dateJakarta = new Date(dateUTC.getTime() + (7 * 60 * 60 * 1000));
  
    // Format the date to display
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
  
    return dateJakarta.toLocaleString('id-ID', options);
  };

  const handlePrint = () => {
    // Create a new window with just the receipt content
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    const receiptHTML = generateReceiptHTML();
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Auto print after loading
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const generateReceiptHTML = () => {
    if (!receiptData) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk - ${receiptData.invoice_number}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            margin: 0;
            padding: 10px;
            width: 280px;
            background: white;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .text-lg { font-size: 16px; }
          .text-sm { font-size: 14px; }
          .text-xs { font-size: 10px; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .pt-1 { padding-top: 4px; }
          .pt-2 { padding-top: 8px; }
          .pb-1 { padding-bottom: 4px; }
          .pb-2 { padding-bottom: 8px; }
          .border-b { border-bottom: 1px dashed #000; }
          .border-t { border-top: 1px dashed #000; }
          .border-solid { border-style: solid !important; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .mt-3 { margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="text-center border-b pb-2 mb-2">
          <div class="font-bold text-lg mb-1">
            ${storeSettings.store_name || 'Aplikasi Kasir v1.0'}
          </div>
          <div class="text-xs mb-1">
            ${storeSettings.store_address || 'Jl. Contoh No. 123, Kota'}
          </div>
          <div class="text-xs">
            ${storeSettings.store_phone ? `Telp: ${storeSettings.store_phone}` : 'Telp: 021-12345678'}
          </div>
        </div>

        <div class="mb-2 border-b pb-2">
          <div>No. Struk: ${receiptData.invoice_number}</div>
          <div>Tanggal: ${(() => {
            const date = new Date(receiptData.created_at);
            const formatted = date.toLocaleString('id-ID', { 
              timeZone: 'Asia/Jakarta',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
            alert('DEBUG HTML TEMPLATE:\\nInput: ' + receiptData.created_at + '\\nFormatted Jakarta: ' + formatted);
            return formatted;
          })()}</div>
          <div>Kasir: ${receiptData.cashier || 'Kasir'}</div>
        </div>

        <div class="border-b border-solid pb-1 mb-1 font-bold">
          <div class="flex justify-between">
            <span style="width: 60%;">Item</span>
            <span style="width: 15%; text-align: center;">Qty</span>
            <span style="width: 25%; text-align: right;">Harga</span>
          </div>
        </div>

        <div class="mb-2">
          ${receiptData.items && receiptData.items.length > 0 ? 
            receiptData.items.map(item => `
              <div class="flex justify-between mb-1">
                <div style="width: 60%;">${item.product_name}</div>
                <div style="width: 15%; text-align: center;">${item.quantity}</div>
                <div style="width: 25%; text-align: right;">${formatCurrency(item.total)}</div>
              </div>
              <div class="text-xs mb-1" style="color: #666;">
                ${item.discount > 0 ? 
                  `&nbsp;&nbsp;@ ${formatCurrency(item.unit_price)} - Disc ${formatCurrency(item.discount)}` :
                  `&nbsp;&nbsp;@ ${formatCurrency(item.unit_price)}`
                }
              </div>
            `).join('') :
            '<div>Tidak ada item</div>'
          }
        </div>

        <div class="border-t pt-1 mt-2">
          <div class="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>${formatCurrency(receiptData.subtotal)}</span>
          </div>
          <div class="flex justify-between mb-1">
            <span>Diskon:</span>
            <span>${formatCurrency(receiptData.discount)}</span>
          </div>
          <div class="flex justify-between font-bold text-sm border-t border-solid pt-1 mt-1">
            <span>TOTAL:</span>
            <span>${formatCurrency(receiptData.total)}</span>
          </div>
        </div>

        <div class="border-t pt-2 mt-2">
          <div class="flex justify-between mb-1">
            <span>Bayar:</span>
            <span>${formatCurrency(receiptData.paid)}</span>
          </div>
          <div class="flex justify-between">
            <span>Kembali:</span>
            <span>${formatCurrency(receiptData.change_amount)}</span>
          </div>
        </div>

        <div class="text-center border-t pt-2 mt-3 text-xs">
          <div>Terima kasih atas kunjungan Anda</div>
          <div>Barang yang sudah dibeli tidak dapat dikembalikan</div>
          <div class="mt-2">*** STRUK ASLI ***</div>
        </div>
      </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Struk Pembayaran</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data struk...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <p className="text-red-600">{error}</p>
            </div>
          ) : receiptData ? (
            <div className="receipt-preview font-mono text-sm">
              {/* Receipt Preview */}
              <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                <div className="font-bold text-base mb-1">
                  {storeSettings.store_name || 'Aplikasi Kasir v1.0'}
                </div>
                <div className="text-xs mb-1">
                  {storeSettings.store_address || 'Jl. Contoh No. 123, Kota'}
                </div>
                <div className="text-xs">
                  {storeSettings.store_phone ? `Telp: ${storeSettings.store_phone}` : 'Telp: 021-12345678'}
                </div>
              </div>

              <div className="mb-2 border-b border-dashed border-gray-400 pb-2">
                <div>No. Struk: {receiptData.invoice_number}</div>
                <div>Tanggal: {(() => {
                  const date = new Date(receiptData.created_at);
                  const formatted = date.toLocaleString('id-ID', { 
                    timeZone: 'Asia/Jakarta',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  });
                  alert('DEBUG MODAL PREVIEW:\\nInput: ' + receiptData.created_at + '\\nFormatted Jakarta: ' + formatted);
                  return formatted;
                })()}</div>
                <div>Kasir: {receiptData.cashier || 'Kasir'}</div>
              </div>

              <div className="border-b border-solid border-gray-400 pb-1 mb-1 font-bold">
                <div className="flex justify-between">
                  <span className="w-3/5">Item</span>
                  <span className="w-1/5 text-center">Qty</span>
                  <span className="w-1/4 text-right">Harga</span>
                </div>
              </div>

              <div className="mb-2">
                {receiptData.items && receiptData.items.length > 0 ? (
                  receiptData.items.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <div className="w-3/5 text-xs">{item.product_name}</div>
                        <div className="w-1/5 text-center">{item.quantity}</div>
                        <div className="w-1/4 text-right">{formatCurrency(item.total)}</div>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {item.discount > 0 ? (
                          <span>&nbsp;&nbsp;@ {formatCurrency(item.unit_price)} - Disc {formatCurrency(item.discount)}</span>
                        ) : (
                          <span>&nbsp;&nbsp;@ {formatCurrency(item.unit_price)}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div>Tidak ada item</div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-400 pt-1 mt-2">
                <div className="flex justify-between mb-1">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(receiptData.subtotal)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Diskon:</span>
                  <span>{formatCurrency(receiptData.discount)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-solid border-gray-400 pt-1 mt-1">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2 mt-2">
                <div className="flex justify-between mb-1">
                  <span>Bayar:</span>
                  <span>{formatCurrency(receiptData.paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembali:</span>
                  <span>{formatCurrency(receiptData.change_amount)}</span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-gray-400 pt-2 mt-3 text-xs">
                <div>Terima kasih atas kunjungan Anda</div>
                <div>Barang yang sudah dibeli tidak dapat dikembalikan</div>
                <div className="mt-2">*** STRUK ASLI ***</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-file-alt text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">Data struk tidak ditemukan</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {receiptData && !loading && !error && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <i className="fas fa-print"></i>
              <span>Print Struk</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Make ReceiptModal available globally
window.ReceiptModal = ReceiptModal;
