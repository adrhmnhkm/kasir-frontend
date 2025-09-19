import React from 'react';
// Impor Link untuk navigasi dan useLocation untuk mengetahui halaman aktif
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  // Gunakan hook useLocation untuk mendapatkan path URL saat ini
  const location = useLocation();
  const currentPath = location.pathname;

  // Definisikan item-item navigasi dalam sebuah array agar mudah dikelola
  const navItems = [
    { path: '/', label: 'POS', icon: 'fas fa-cash-register' },
    { path: '/products', label: 'Produk', icon: 'fas fa-box' },
    { path: '/inventory', label: 'Inventaris', icon: 'fas fa-warehouse' },
    { path: '/sales', label: 'Penjualan', icon: 'fas fa-chart-line' },
    { path: '/expenses', label: 'Pengeluaran', icon: 'fas fa-file-invoice-dollar' },
    { path: '/accounting', label: 'Akuntansi', icon: 'fas fa-book' },
    { path: '/settings', label: 'Pengaturan', icon: 'fas fa-cog' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-1/5 bg-white shadow-md p-4 flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-8 text-blue-600">KasirKu</h1>
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => {
            // Cek apakah path item saat ini adalah halaman yang aktif
            const isActive = currentPath === item.path;
            
            // Terapkan styling yang berbeda jika link sedang aktif
            const linkClassName = `flex items-center p-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-200 ${
              isActive ? 'bg-blue-500 text-white shadow' : ''
            }`;

            return (
              <Link key={item.path} to={item.path} className={linkClassName}>
                <i className={`${item.icon} w-6 text-center`}></i>
                <span className="ml-4">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="w-4/5 p-6 overflow-y-auto">
        {/* 'children' di sini adalah halaman yang di-render oleh <Routes> di App.jsx */}
        {children}
      </main>
    </div>
  );
}