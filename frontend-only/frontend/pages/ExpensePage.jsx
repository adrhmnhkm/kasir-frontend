const { useState, useEffect } = React;

const ExpensePage = ({ showNotification }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    total_expenses: 0,
    today_expenses: 0,
    today_transaction_count: 0,
    categories: [],
    category_breakdown: []
  });

  useEffect(() => {
    loadExpenses();
    loadCategories();
    loadSummary();
  }, [selectedCategory, dateFilter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      if (dateFilter !== 'all') {
        const today = new Date();
        let startDate, endDate;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            break;
          case 'week':
            startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = today;
            break;
          case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;
        }
        
        if (startDate && endDate) {
          params.append('start_date', startDate.toISOString().split('T')[0]);
          params.append('end_date', endDate.toISOString().split('T')[0]);
        }
      }

      const queryParams = Object.fromEntries(params);
      const data = await api.expenses.getAll(queryParams);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      showNotification('Error loading expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.expenses.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await api.expenses.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (id) => {
    if (confirm('Yakin ingin menghapus pengeluaran ini?')) {
      try {
        await api.expenses.delete(id);

        showNotification('Pengeluaran berhasil dihapus');
        loadExpenses();
        loadSummary();
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }
  };

  const handleSaveExpense = () => {
    loadExpenses();
    loadSummary();
    setEditingExpense(null);
    setShowExpenseModal(false);
  };

  const openExpenseModal = () => {
    setEditingExpense(null);
    setShowExpenseModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'operasional': 'bg-blue-100 text-blue-800',
      'pembelian': 'bg-green-100 text-green-800',
      'gaji': 'bg-purple-100 text-purple-800',
      'transportasi': 'bg-yellow-100 text-yellow-800',
      'listrik': 'bg-orange-100 text-orange-800',
      'maintenance': 'bg-red-100 text-red-800',
      'lainnya': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['lainnya'];
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.total_expenses)}
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
              <p className="text-sm font-medium text-gray-600">Pengeluaran Hari Ini</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.today_expenses)}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <i className="fas fa-calendar-day text-orange-600"></i>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {summary.today_transaction_count} transaksi
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Kategori Aktif</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.categories.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-tags text-blue-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Cari pengeluaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Periode</option>
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">Bulan Ini</option>
            </select>
          </div>
          <button
            onClick={openExpenseModal}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Tambah Pengeluaran
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow">
        <ExpenseTable
          expenses={filteredExpenses}
          loading={loading}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getCategoryColor={getCategoryColor}
        />
      </div>

      {/* Category Breakdown */}
      {summary.category_breakdown && summary.category_breakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Breakdown per Kategori</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.category_breakdown.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">{item.count} item</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(item.total_amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseForm
          isOpen={showExpenseModal}
          editingExpense={editingExpense}
          categories={categories}
          onSave={handleSaveExpense}
          onClose={() => setShowExpenseModal(false)}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

// Make ExpensePage available globally
window.ExpensePage = ExpensePage;
