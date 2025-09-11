const { useState, useEffect } = React;

const AccountingPage = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    today: {
      revenue: 0,
      totalHPP: 0,
      grossProfit: 0,
      grossMargin: 0,
      expenses: 0,
      netProfit: 0,
      profitMargin: 0,
      transactions: 0
    },
    thisMonth: {
      revenue: 0,
      totalHPP: 0,
      grossProfit: 0,
      grossMargin: 0,
      expenses: 0,
      netProfit: 0,
      profitMargin: 0,
      transactions: 0
    },
    cashFlow: [],
    profitTrend: [],
    profitLoss: [],
    hppBreakdown: []
  });
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load financial data using proper APIs
      const [todayData, selectedData, expenses, allSales] = await Promise.all([
        api.reports.getFinancial({ range: 'today' }),
        api.reports.getFinancial({ range: dateRange }),
        api.expenses.getSummary(),
        api.sales.getAll()
      ]);
      
      // Calculate transaction counts
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      const todayTransactions = allSales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= todayStart && saleDate <= todayEnd && !sale.is_draft;
      }).length;

      let selectedPeriodTransactions = allSales.filter(sale => !sale.is_draft).length;
      
      if (dateRange === 'today') {
        selectedPeriodTransactions = todayTransactions;
      } else if (dateRange === 'week') {
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        selectedPeriodTransactions = allSales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate >= weekStart && !sale.is_draft;
        }).length;
      } else if (dateRange === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        selectedPeriodTransactions = allSales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate >= monthStart && !sale.is_draft;
        }).length;
      }

      setDashboardData({
        today: {
          revenue: todayData.summary?.revenue || 0,
          totalHPP: todayData.summary?.totalHPP || 0,
          grossProfit: todayData.summary?.grossProfit || 0,
          grossMargin: todayData.summary?.grossMargin || 0,
          expenses: expenses.today_expenses || 0,
          netProfit: todayData.summary?.netProfit || 0,
          profitMargin: todayData.summary?.profitMargin || 0,
          transactions: todayData.summary?.transactionCount || todayTransactions
        },
        thisMonth: {
          revenue: selectedData.summary?.revenue || 0,
          totalHPP: selectedData.summary?.totalHPP || 0,
          grossProfit: selectedData.summary?.grossProfit || 0,
          grossMargin: selectedData.summary?.grossMargin || 0,
          expenses: selectedData.summary?.expenses || 0,
          netProfit: selectedData.summary?.netProfit || 0,
          profitMargin: selectedData.summary?.profitMargin || 0,
          transactions: selectedData.summary?.transactionCount || selectedPeriodTransactions
        },
        cashFlow: selectedData.cash_flow || [],
        profitTrend: selectedData.profit_trend || [],
        profitLoss: selectedData.profitLoss || [],
        hppBreakdown: selectedData.hppBreakdown || []
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showNotification('Error loading dashboard data', 'error');
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

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPeriodLabel = (range) => {
    switch (range) {
      case 'today': return 'Hari Ini';
      case 'yesterday': return 'Kemarin';
      case 'week': return '7 Hari Terakhir';
      case 'month': return 'Bulan Ini';
      default: return 'Periode Dipilih';
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: 'fas fa-chart-pie' },
    { id: 'expenses', name: 'Pengeluaran', icon: 'fas fa-money-bill-wave' },
    { id: 'hpp', name: 'Analisis HPP', icon: 'fas fa-calculator' },
    { id: 'cashflow', name: 'Cash Flow', icon: 'fas fa-chart-line' },
    { id: 'profitloss', name: 'Laba Rugi', icon: 'fas fa-chart-bar' }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Akuntansi & Keuangan</h2>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Hari Ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
          </select>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <i className={`${tab.icon} mr-2`}></i>
            {tab.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading text="Memuat data keuangan..." />
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI Cards - Today */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Ringkasan Hari Ini</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pendapatan</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(dashboardData.today.revenue)}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-arrow-up text-green-600"></i>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">
                        {dashboardData.today.transactions} transaksi
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">HPP (Cost)</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(dashboardData.today.totalHPP)}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-box text-orange-600"></i>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">
                        Harga Pokok
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Laba Kotor</p>
                        <p className={`text-2xl font-bold ${
                          dashboardData.today.grossProfit >= 0 ? 'text-purple-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(dashboardData.today.grossProfit)}
                        </p>
                      </div>
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        dashboardData.today.grossProfit >= 0 ? 'bg-purple-100' : 'bg-red-100'
                      }`}>
                        <i className={`fas fa-chart-bar ${
                          dashboardData.today.grossProfit >= 0 ? 'text-purple-600' : 'text-red-600'
                        }`}></i>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">
                        Margin: {dashboardData.today.grossMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Biaya Operasional</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(dashboardData.today.expenses)}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-money-bill-wave text-red-600"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Laba Bersih</p>
                        <p className={`text-2xl font-bold ${
                          dashboardData.today.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(dashboardData.today.netProfit)}
                        </p>
                      </div>
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        dashboardData.today.netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'
                      }`}>
                        <i className={`fas fa-chart-line ${
                          dashboardData.today.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}></i>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">
                        Margin: {dashboardData.today.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Cash Flow</p>
                        <p className={`text-2xl font-bold ${
                          (dashboardData.today.revenue - dashboardData.today.expenses) >= 0 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(dashboardData.today.revenue - dashboardData.today.expenses)}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-coins text-purple-600"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Period Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Ringkasan {getPeriodLabel(dateRange)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Total Pendapatan</h4>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(dashboardData.thisMonth.revenue)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {dashboardData.thisMonth.transactions} transaksi
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Total HPP</h4>
                    <p className="text-3xl font-bold text-orange-600">
                      {formatCurrency(dashboardData.thisMonth.totalHPP)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Harga Pokok Penjualan
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Laba Kotor</h4>
                    <p className={`text-3xl font-bold ${
                      dashboardData.thisMonth.grossProfit >= 0 ? 'text-purple-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(dashboardData.thisMonth.grossProfit)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Margin: {dashboardData.thisMonth.grossMargin.toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Biaya Operasional</h4>
                    <p className="text-3xl font-bold text-red-600">
                      {formatCurrency(dashboardData.thisMonth.expenses)}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Laba Bersih</h4>
                    <p className={`text-3xl font-bold ${
                      dashboardData.thisMonth.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(dashboardData.thisMonth.netProfit)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Margin: {dashboardData.thisMonth.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit & Loss Breakdown */}
              {dashboardData.profitLoss && dashboardData.profitLoss.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Laba Rugi {getPeriodLabel(dateRange)}</h3>
                  <div className="space-y-3">
                    {dashboardData.profitLoss.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{item.category}</span>
                        <span className={`font-bold ${
                          item.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(Math.abs(item.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Aksi Cepat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <i className="fas fa-plus text-blue-500 mr-3"></i>
                    <span className="text-sm font-medium">Tambah Pengeluaran</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('cashflow')}
                    className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <i className="fas fa-chart-line text-green-500 mr-3"></i>
                    <span className="text-sm font-medium">Lihat Cash Flow</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('profitloss')}
                    className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <i className="fas fa-chart-bar text-purple-500 mr-3"></i>
                    <span className="text-sm font-medium">Laporan Laba Rugi</span>
                  </button>
                  
                  <button
                    onClick={() => window.open('/api/reports/financial?range=month&format=pdf', '_blank')}
                    className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <i className="fas fa-download text-orange-500 mr-3"></i>
                    <span className="text-sm font-medium">Export Laporan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <ExpensePage showNotification={showNotification} />
          )}

          {activeTab === 'hpp' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Analisis Harga Pokok Penjualan (HPP)</h3>
                <p className="text-gray-600 mb-6">
                  Analisis margin per produk untuk periode {getPeriodLabel(dateRange)}
                </p>
                
                {/* HPP Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Total Pendapatan</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(dashboardData.thisMonth.revenue)}
                        </p>
                      </div>
                      <i className="fas fa-arrow-up text-3xl text-green-200"></i>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100">Total HPP</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(dashboardData.thisMonth.totalHPP)}
                        </p>
                      </div>
                      <i className="fas fa-box text-3xl text-orange-200"></i>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Laba Kotor</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(dashboardData.thisMonth.grossProfit)}
                        </p>
                        <p className="text-purple-100 text-sm mt-1">
                          Margin: {dashboardData.thisMonth.grossMargin.toFixed(1)}%
                        </p>
                      </div>
                      <i className="fas fa-chart-bar text-3xl text-purple-200"></i>
                    </div>
                  </div>
                </div>
                
                {/* HPP Breakdown Table */}
                {dashboardData.hppBreakdown && dashboardData.hppBreakdown.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produk
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty Terjual
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Harga Beli
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Harga Jual
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total HPP
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pendapatan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Margin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.hppBreakdown.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{item.product_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {item.quantity_sold}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {formatCurrency(item.purchase_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {formatCurrency(item.selling_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-orange-600 font-semibold">
                              {formatCurrency(item.hpp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                              {formatCurrency(item.revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`font-semibold ${
                                item.margin >= 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(item.margin)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.margin_percentage >= 20 ? 'bg-green-100 text-green-800' :
                                item.margin_percentage >= 10 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.margin_percentage.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-calculator text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-500">Tidak ada data HPP untuk periode ini</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cashflow' && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <i className="fas fa-chart-line text-6xl text-blue-600 mb-4"></i>
              <p className="text-gray-600">Cash Flow Analysis akan segera diimplementasikan</p>
            </div>
          )}

          {activeTab === 'profitloss' && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <i className="fas fa-chart-bar text-6xl text-purple-600 mb-4"></i>
              <p className="text-gray-600">Profit & Loss Statement akan segera diimplementasikan</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Make AccountingPage available globally
window.AccountingPage = AccountingPage;
