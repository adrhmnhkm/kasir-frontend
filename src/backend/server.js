const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, checkDatabaseFile } = require('./utils/initializeDatabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'https://frontend-only-tau.vercel.app',
    'https://frontend-only-hqmtqlh1y-adrhmnhkms-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// API routes
app.use('/api', require('./routes'));

// Receipt page route
app.get('/receipt/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/receipt.html'));
});

// Serve JSX files from src/frontend directory (MUST BE BEFORE STATIC FILES)
app.get('/src/frontend/*.jsx', (req, res) => {
  const filePath = path.join(__dirname, '../../', req.path);
  console.log('Serving JSX file:', req.path, '->', filePath);
  
  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return res.status(404).send('File not found');
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving JSX file:', err);
      res.status(500).send('Error serving file');
    }
  });
});

app.get('/src/frontend/**/*.jsx', (req, res) => {
  const filePath = path.join(__dirname, '../../', req.path);
  console.log('Serving JSX file:', req.path, '->', filePath);
  
  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return res.status(404).send('File not found');
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving JSX file:', err);
      res.status(500).send('Error serving file');
    }
  });
});

app.get('/src/frontend/*.js', (req, res) => {
  const filePath = path.join(__dirname, '../../', req.path);
  console.log('Serving JS file:', req.path, '->', filePath);
  
  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return res.status(404).send('File not found');
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving JS file:', err);
      res.status(500).send('Error serving file');
    }
  });
});

app.get('/src/frontend/**/*.js', (req, res) => {
  const filePath = path.join(__dirname, '../../', req.path);
  console.log('Serving JS file:', req.path, '->', filePath);
  
  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return res.status(404).send('File not found');
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving JS file:', err);
      res.status(500).send('Error serving file');
    }
  });
});

// Serve static files from public directory (excluding index.html)
app.use(express.static(path.join(__dirname, '../../public'), {
  index: false // Disable default index.html serving
}));

// Serve React app for all other routes (SPA routing) - MUST BE LAST
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Initialize database
async function initializeApp() {
  try {
    // Check database file
    const dbInfo = checkDatabaseFile();
    
    // Initialize database
    await initializeDatabase();
    
    console.log('✅ Database initialized');
    console.log(`📍 Database location: ${dbInfo.path}`);
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

// For local development
if (require.main === module) {
  async function startServer() {
    await initializeApp();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Application: http://localhost:${PORT}`);
      console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
      console.log(`🛍️  Products: http://localhost:${PORT}/api/products`);
      console.log(`💰 Sales: http://localhost:${PORT}/api/sales`);
      console.log(`💸 Expenses: http://localhost:${PORT}/api/expenses`);
    });
  }
  
  startServer();
} else {
  // For Vercel deployment - initialize without listening
  initializeApp();
}

module.exports = app;