import React from 'react';
import ReactDOM from 'react-dom';
import { useNotification } from './hooks/useNotification';
import { Layout } from './components/common/Layout';
import { Notification } from './components/common/Notification';
import { ReceiptPage } from './components/common/ReceiptPage';
import { POSPage } from './pages/POSPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { SettingsPage } from './pages/SettingsPage';
import { AccountingPage } from './pages/AccountingPage';
import { ExpensePage } from './pages/ExpensePage';
import './styles.css';


const { useState } = React;

// Temporary placeholder components
// Temporary placeholder for expenses - will be removed when ExpensePage is fully integrated
const ExpensesPage = ({ showNotification }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-6">Manajemen Pengeluaran</h2>
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <i className="fas fa-money-bill-wave text-6xl text-red-600 mb-4"></i>
      <p className="text-gray-600">Menggunakan fitur Akuntansi untuk manajemen pengeluaran lengkap</p>
      <button 
        onClick={() => window.location.hash = '#accounting'}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Buka Fitur Akuntansi
      </button>
    </div>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState('pos');
  const { notification, showNotification, hideNotification } = useNotification();

  // Check if this is a receipt page based on URL
  const checkReceiptPage = () => {
    const path = window.location.pathname;
    const receiptMatch = path.match(/^\/receipt\/(\d+)$/);
    return receiptMatch ? receiptMatch[1] : null;
  };

  const saleId = checkReceiptPage();

  // If this is a receipt page, render only the receipt
  if (saleId) {
    return <ReceiptPage saleId={saleId} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'pos':
        return <POSPage showNotification={showNotification} />;
      case 'products':
        return <ProductsPage showNotification={showNotification} />;
      case 'inventory':
        return <InventoryPage showNotification={showNotification} />;
      case 'sales':
        return <SalesPage showNotification={showNotification} />;
      case 'expenses':
        return <ExpensesPage showNotification={showNotification} />;
      case 'accounting':
        return <AccountingPage showNotification={showNotification} />;
      case 'settings':
        return <SettingsPage showNotification={showNotification} />;
      default:
        return <POSPage showNotification={showNotification} />;
    }
  };

  return (
    <div className="app">
      <Layout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      >
        {renderPage()}
      </Layout>

      <Notification 
        notification={notification} 
        onClose={hideNotification} 
      />
    </div>
  );
}

// Make App available globally
window.App = App; 