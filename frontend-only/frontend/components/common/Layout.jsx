import React from 'react';

const { useState } = React;

const Layout = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'pos', name: 'Point of Sale', icon: 'fas fa-cash-register' },
    { id: 'products', name: 'Produk', icon: 'fas fa-box' },
    { id: 'inventory', name: 'Inventory', icon: 'fas fa-warehouse' },
    { id: 'sales', name: 'Penjualan', icon: 'fas fa-chart-line' },
    { id: 'expenses', name: 'Pengeluaran', icon: 'fas fa-money-bill-wave' },
    { id: 'accounting', name: 'Akuntansi', icon: 'fas fa-calculator' },
    { id: 'settings', name: 'Pengaturan', icon: 'fas fa-cog' }
  ];

  const currentMenuItem = menuItems.find(item => item.id === currentPage);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-blue-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h1 className={`font-bold text-xl ${sidebarOpen ? 'block' : 'hidden'}`}>
              Aplikasi Kasir V1.0
            </h1>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
        
        <nav className="mt-8">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-700 transition-colors ${
                currentPage === item.id ? 'bg-blue-700 border-r-4 border-yellow-400' : ''
              }`}
            >
              <i className={`${item.icon} w-6`}></i>
              <span className={`ml-3 ${sidebarOpen ? 'block' : 'hidden'}`}>
                {item.name}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {currentMenuItem?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'Asia/Jakarta'
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Make Layout available globally
window.Layout = Layout; 