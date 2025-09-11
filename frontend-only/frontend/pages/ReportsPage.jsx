const { useState, useEffect } = React;

const ReportsPage = ({ showNotification }) => {
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      console.log('Loading sales data...');
      
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        range: 'today'
      });

      console.log('API params:', params.toString());

      const queryParams = Object.fromEntries(params);
      const data = await api.reports.getSales(queryParams);
      console.log('Sales data received:', data);
      
      setSalesData(data);
    } catch (error) {
      console.error('Error loading sales data:', error);
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Laporan & Analisis</h2>
        <button
          onClick={loadSalesData}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : (
            <div className="flex items-center">
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </div>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Laporan Penjualan Hari Ini</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading data...</p>
          </div>
        )}

        {!loading && !salesData && (
          <div className="text-center py-8">
            <p className="text-gray-500">Klik Refresh untuk memuat data</p>
          </div>
        )}

        {!loading && salesData && (
          <div className="space-y-6">
            {/* Debug Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800">Debug Info:</h4>
              <p className="text-sm text-blue-700">Data loaded successfully!</p>
              <p className="text-sm text-blue-700">Total Sales: {salesData.summary?.totalSales || 'N/A'}</p>
              <p className="text-sm text-blue-700">Total Revenue: {salesData.summary?.totalRevenue || 'N/A'}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <i className="fas fa-shopping-cart text-green-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Penjualan</p>
                    <p className="text-lg font-semibold">{salesData.summary?.totalSales || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <i className="fas fa-money-bill-wave text-blue-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Pendapatan</p>
                    <p className="text-lg font-semibold">{formatCurrency(salesData.summary?.totalRevenue || 0)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <i className="fas fa-percentage text-yellow-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Rata-rata per Transaksi</p>
                    <p className="text-lg font-semibold">{formatCurrency(salesData.summary?.averageTransaction || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products */}
            {salesData.topProducts && salesData.topProducts.length > 0 && (
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h4 className="font-semibold">Produk Terlaris</h4>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {salesData.topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">Kode: {product.code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{product.quantity} terjual</p>
                          <p className="text-sm text-gray-600">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Sales */}
            {salesData.recentSales && salesData.recentSales.length > 0 && (
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h4 className="font-semibold">Penjualan Terbaru</h4>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {salesData.recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{sale.invoice_number}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(sale.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(sale.total)}</p>
                          <p className="text-sm text-gray-600">{sale.item_count} items</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Make ReportsPage available globally
window.ReportsPage = ReportsPage;
