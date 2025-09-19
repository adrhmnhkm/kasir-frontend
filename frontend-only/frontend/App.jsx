import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Impor komponen dan halaman Anda
import Layout from './components/common/Layout';
import Notification from './components/common/Notification';
import POSPage from './pages/POSPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import ExpensePage from './pages/ExpensePage';
import AccountingPage from './pages/AccountingPage';
import SettingsPage from './pages/SettingsPage';
import { useNotification } from './hooks/useNotification';
import ReceiptPage from './components/common/ReceiptPage';


function App() {
  // Gunakan custom hook Anda untuk notifikasi
  const { notification, showNotification, hideNotification } = useNotification();

  return (
    // 1. Bungkus seluruh aplikasi dengan Router
    <Router>
      <div className="app">
        {/* 2. Layout sekarang berada di dalam Router */}
        <Layout>
          {/* 3. Gunakan <Routes> untuk mendefinisikan semua kemungkinan halaman */}
          <Routes>
            <Route path="/" element={<POSPage showNotification={showNotification} />} />
            <Route path="/products" element={<ProductsPage showNotification={showNotification} />} />
            <Route path="/inventory" element={<InventoryPage showNotification={showNotification} />} />
            <Route path="/sales" element={<SalesPage showNotification={showNotification} />} />
            <Route path="/expenses" element={<ExpensePage showNotification={showNotification} />} />
            <Route path="/accounting" element={<AccountingPage showNotification={showNotification} />} />
            <Route path="/settings" element={<SettingsPage showNotification={showNotification} />} />
            
            {/* Rute untuk halaman struk jika diakses langsung */}
            <Route path="/receipt/:saleId" element={<ReceiptPage />} />
          </Routes>
        </Layout>

        <Notification 
          notification={notification} 
          onClose={hideNotification} 
        />
      </div>
    </Router>
  );
}

// Render aplikasi Anda (jika ini adalah file entry point utama)
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);