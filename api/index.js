// Vercel serverless function entry point
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const categoriesRoutes = require('../src/backend/routes/categories');
const productsRoutes = require('../src/backend/routes/products');
const salesRoutes = require('../src/backend/routes/sales');
const inventoryRoutes = require('../src/backend/routes/inventory');
const expensesRoutes = require('../src/backend/routes/expenses');
const reportsRoutes = require('../src/backend/routes/reports');

// API Routes
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Aplikasi Kasir API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve JSX files as text for in-browser compilation
app.get('/src/frontend/*', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  
  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  
  // Set appropriate content type
  if (req.path.endsWith('.jsx')) {
    res.setHeader('Content-Type', 'text/babel');
  } else if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else {
    res.setHeader('Content-Type', 'text/plain');
  }
  
  res.sendFile(filePath);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize database when module loads
(async () => {
  try {
    // Check if we're in production and need PostgreSQL
    if (process.env.NODE_ENV === 'production' && (process.env.POSTGRES_URL || process.env.DATABASE_URL)) {
      console.log('🐘 Initializing PostgreSQL for production...');
      const db = require('../src/backend/database/postgres');
      await db.testConnection();
      await db.initializeTables();
    } else {
      console.log('📱 Using SQLite for development...');
      const initializeDatabase = require('../src/backend/utils/initializeDatabase');
      await initializeDatabase();
    }
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
})();

module.exports = app;
