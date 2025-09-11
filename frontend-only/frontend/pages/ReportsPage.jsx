const { useState, useEffect } = React;

const ReportsPage = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Data states for different reports
  const [salesData, setSalesData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);

  useEffect(() => {
    loadReportData();
  }, [activeTab, period, customDateRange]);

  const getDateRange = () => {
    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 23, 59, 59);
        break;
      case 'week':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start);
          endDate = new Date(customDateRange.end + 'T23:59:59');
        } else {
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        }
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    }

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      range: period === 'custom' ? 'custom' : period
    };
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const dateParams = getDateRange();
      
      switch (activeTab) {
        case 'sales':
          const salesData = await api.reports.getSales(dateParams);
          setSalesData(salesData);
          break;
        case 'financial':
          const financialData = await api.reports.getFinancial(dateParams);
          setFinancialData(financialData);
          break;
        case 'products':
          const productsData = await api.reports.getProducts(dateParams);
          setProductsData(productsData);
          break;
        case 'inventory':
          const inventoryData = await api.reports.getFinancial(dateParams); // Using financial for now as inventory endpoint might not exist
          setInventoryData(inventoryData);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${activeTab} data:`, error);
      showNotification(`Error loading ${activeTab} report: ${error.message}`, 'error');
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

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Hari Ini';
      case 'yesterday': return 'Kemarin';
      case 'week': return '7 Hari Terakhir';
      case 'month': return 'Bulan Ini';
      case 'custom': return `${customDateRange.start} - ${customDateRange.end}`;
      default: return 'Hari Ini';
    }
  };

  const renderSalesReport = () => (
    <div className="space-y-6">
      {salesData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <i className="fas fa-chart-line text-yellow-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Rata-rata Transaksi</p>
                  <p className="text-lg font-semibold">{formatCurrency(salesData.summary?.averageTransaction || 0)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <i className="fas fa-percentage text-purple-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Growth</p>
                  <p className="text-lg font-semibold">{salesData.summary?.growth || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products and Recent Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b">
                <h4 className="font-semibold">Produk Terlaris</h4>
              </div>
              <div className="p-4">
                {salesData.topProducts && salesData.topProducts.length > 0 ? (
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
                ) : (
                  <p className="text-gray-500 text-center py-4">Tidak ada data produk</p>
                )}
              </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b">
                <h4 className="font-semibold">Penjualan Terbaru</h4>
              </div>
              <div className="p-4">
                {salesData.recentSales && salesData.recentSales.length > 0 ? (
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
                ) : (
                  <p className="text-gray-500 text-center py-4">Tidak ada data penjualan</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderFinancialReport = () => (
    <div className="space-y-6">
      {financialData && (
        <>
          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <i className="fas fa-hand-holding-usd text-green-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pendapatan</p>
                  <p className="text-lg font-semibold">{formatCurrency(financialData.summary?.revenue || 0)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <i className="fas fa-money-bill text-red-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pengeluaran</p>
                  <p className="text-lg font-semibold">{formatCurrency(financialData.summary?.expenses || 0)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <i className="fas fa-chart-line text-blue-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Laba Bersih</p>
                  <p className="text-lg font-semibold">{formatCurrency(financialData.summary?.netProfit || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Loss Statement */}
          {financialData.profitLoss && (
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b">
                <h4 className="font-semibold">Laporan Laba Rugi</h4>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {financialData.profitLoss.map((item, index) => (
                    <div key={index} className={`flex justify-between py-2 px-3 rounded ${
                      item.type === 'net_profit' ? 'bg-blue-50 font-semibold' :
                      item.type === 'gross_profit' ? 'bg-green-50' :
                      item.type === 'income' ? 'bg-green-50' :
                      'bg-red-50'
                    }`}>
                      <span>{item.category}</span>
                      <span className={item.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(Math.abs(item.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderProductsReport = () => (
    <div className="space-y-6">
      {productsData && (
        <>
          {/* Products Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <i className="fas fa-boxes text-blue-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Produk</p>
                  <p className="text-lg font-semibold">{productsData.summary?.totalProducts || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <i className="fas fa-warehouse text-green-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Stok</p>
                  <p className="text-lg font-semibold">{productsData.summary?.totalStock || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <i className="fas fa-exclamation-triangle text-orange-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Stok Menipis</p>
                  <p className="text-lg font-semibold">{productsData.summary?.lowStockCount || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <i className="fas fa-tags text-purple-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Kategori Aktif</p>
                  <p className="text-lg font-semibold">{productsData.summary?.activeCategories || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Products */}
          {productsData.lowStock && productsData.lowStock.length > 0 && (
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b">
                <h4 className="font-semibold">Produk Stok Menipis</h4>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productsData.lowStock.map((product) => (
                    <div key={product.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">Kode: {product.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-orange-600 font-semibold">{product.stock} {product.unit}</p>
                          <p className="text-sm text-gray-600">Min: {product.min_stock}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
        <h2 className="text-2xl font-bold">Laporan & Analisis</h2>
        
        {/* Period Filter */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
              <option value="week">7 Hari</option>
              <option value="month">Bulan Ini</option>
              <option value="custom">Custom</option>
            </select>
            
            {period === 'custom' && (
              <>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
          </div>
          
          <button
            onClick={loadReportData}
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
      </div>

      {/* Period Info */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium">
            <i className="fas fa-calendar-alt mr-2"></i>
            Periode: {getPeriodLabel()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'sales'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <i className="fas fa-chart-line mr-2"></i>
            Laporan Penjualan
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'financial'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <i className="fas fa-dollar-sign mr-2"></i>
            Laporan Keuangan
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'products'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <i className="fas fa-boxes mr-2"></i>
            Laporan Produk
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data laporan...</p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'sales' && renderSalesReport()}
            {activeTab === 'financial' && renderFinancialReport()}
            {activeTab === 'products' && renderProductsReport()}
          </>
        )}

        {!loading && (
          <>
            {(activeTab === 'sales' && !salesData) && (
              <div className="text-center py-8">
                <i className="fas fa-chart-line text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">Tidak ada data penjualan untuk periode ini</p>
              </div>
            )}
            {(activeTab === 'financial' && !financialData) && (
              <div className="text-center py-8">
                <i className="fas fa-dollar-sign text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">Tidak ada data keuangan untuk periode ini</p>
              </div>
            )}
            {(activeTab === 'products' && !productsData) && (
              <div className="text-center py-8">
                <i className="fas fa-boxes text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">Tidak ada data produk untuk periode ini</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Make ReportsPage available globally
window.ReportsPage = ReportsPage;
