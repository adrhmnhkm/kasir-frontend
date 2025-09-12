const { useState, useEffect } = React;

const SalesPage = ({ showNotification }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month, draft
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, draft
  const [sortBy, setSortBy] = useState('date'); // date, total, invoice
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  useEffect(() => {
    loadSales();
  }, [filter, dateRange, statusFilter]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Date/period filter
      if (filter === 'today') {
        params.period = 'today';
      } else if (filter === 'week') {
        params.period = 'week';
      } else if (filter === 'month') {
        params.period = 'month';
      } else if (filter === 'range' && dateRange.start && dateRange.end) {
        params.start_date = dateRange.start;
        params.end_date = dateRange.end;
      }

      // Status filter
      if (statusFilter === 'draft') {
        params.draft = 'true';
      } else if (statusFilter === 'completed') {
        params.status = 'completed';
      }

      const data = await api.sales.getAll(params);
      setSales(data);
    } catch (error) {
      showNotification('Error loading sales', 'error');
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = (saleId) => {
    setSelectedSaleId(saleId);
    setShowReceiptModal(true);
  };

  const handleFinalizeDraft = async (saleId) => {
    if (confirm('Yakin ingin finalisasi draft ini?')) {
      try {
        await api.sales.finalize(saleId, {});
        showNotification('Draft berhasil difinalisasi');
        loadSales();
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }
  };

  const handleDeleteDraft = async (saleId) => {
    if (confirm('Yakin ingin menghapus draft ini?')) {
      try {
        await api.sales.delete(saleId);
        showNotification('Draft berhasil dihapus');
        loadSales();
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }
  };

  const getFilteredAndSortedSales = () => {
    let filteredSales = [...sales];

    // Apply search filter
    if (searchTerm) {
      filteredSales = filteredSales.filter(sale =>
        sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.cashier && sale.cashier.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    filteredSales.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'total':
          aValue = parseFloat(a.total);
          bValue = parseFloat(b.total);
          break;
        case 'invoice':
          aValue = a.invoice_number;
          bValue = b.invoice_number;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredSales;
  };

  const getSummary = () => {
    const filteredSales = getFilteredAndSortedSales();
    const completedSales = filteredSales.filter(sale => !sale.is_draft);
    const totalSales = completedSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = completedSales.length;
    const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalDiscount = completedSales.reduce((sum, sale) => sum + (sale.discount || 0), 0);

    return {
      totalSales,
      totalTransactions,
      avgTransaction,
      totalDiscount,
      draftCount: filteredSales.filter(sale => sale.is_draft).length
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const summary = getSummary();
  const filteredSales = getFilteredAndSortedSales();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Penjualan</h2>
        <button
          onClick={loadSales}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-money-bill-wave text-green-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Penjualan</p>
              <p className="text-lg font-semibold">{formatCurrency(summary.totalSales)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fas fa-shopping-cart text-blue-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="text-lg font-semibold">{summary.totalTransactions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="fas fa-percentage text-yellow-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Rata-rata Transaksi</p>
              <p className="text-lg font-semibold">{formatCurrency(summary.avgTransaction)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="fas fa-tag text-purple-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Diskon</p>
              <p className="text-lg font-semibold">{formatCurrency(summary.totalDiscount)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <i className="fas fa-file-alt text-orange-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-lg font-semibold">{summary.draftCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Period Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Periode</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="all">Semua Periode</option>
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="range">Rentang Tanggal</option>
            </select>
          </div>

          {/* Date Range */}
          {filter === 'range' && (
            <>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Status Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Pencarian</label>
            <input
              type="text"
              placeholder="Cari invoice, customer, kasir..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            />
          </div>

          {/* Sort Options */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Urutkan</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Tanggal</option>
                <option value="total">Total</option>
                <option value="invoice">Invoice</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={`Urutkan ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex flex-col justify-end">
            <button
              onClick={() => {
                setFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
                setDateRange({ start: '', end: '' });
                setSortBy('date');
                setSortOrder('desc');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="fas fa-times mr-2"></i>
              Reset Filter
            </button>
          </div>
        </div>

        {/* Filter Status Display */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filter !== 'all' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Periode: {
                filter === 'today' ? 'Hari Ini' :
                filter === 'week' ? 'Minggu Ini' :
                filter === 'month' ? 'Bulan Ini' :
                filter === 'range' ? `${dateRange.start} - ${dateRange.end}` : filter
              }
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              Status: {statusFilter === 'completed' ? 'Selesai' : 'Draft'}
            </span>
          )}
          {searchTerm && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
              Pencarian: "{searchTerm}"
            </span>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Menampilkan {filteredSales.length} dari {sales.length} total penjualan
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Diurutkan berdasarkan: {
              sortBy === 'date' ? 'Tanggal' :
              sortBy === 'total' ? 'Total' :
              sortBy === 'invoice' ? 'Invoice' : 'Tanggal'
            } ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})</span>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading sales data...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-8 text-center">
              <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-500">
                {sales.length === 0 ? 'Tidak ada data penjualan' : 'Tidak ada data yang sesuai dengan filter'}
              </p>
              {sales.length > 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  Coba ubah filter atau kata kunci pencarian
                </p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        if (sortBy === 'invoice') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('invoice');
                          setSortOrder('asc');
                        }
                      }}>
                    Invoice
                    {sortBy === 'invoice' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        if (sortBy === 'date') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('date');
                          setSortOrder('desc');
                        }
                      }}>
                    Tanggal
                    {sortBy === 'date' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        if (sortBy === 'total') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('total');
                          setSortOrder('desc');
                        }
                      }}>
                    Total
                    {sortBy === 'total' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{sale.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sale.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sale.customer_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sale.item_count} items</td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(sale.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        sale.is_draft 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {sale.is_draft ? 'Draft' : 'Selesai'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePrintReceipt(sale.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Print Receipt"
                        >
                          <i className="fas fa-print"></i>
                        </button>
                        {sale.is_draft && (
                          <>
                            <button
                              onClick={() => handleFinalizeDraft(sale.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Finalize Draft"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(sale.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Draft"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>

    {/* Receipt Modal */}
    <ReceiptModal 
      isOpen={showReceiptModal}
      onClose={() => setShowReceiptModal(false)}
      saleId={selectedSaleId}
    />
  );
};

// Make SalesPage available globally
window.SalesPage = SalesPage; 