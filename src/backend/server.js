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
    'https://frontend-only-rngslz46p-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-cxaw2brra-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-43a43qt8k-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-310k3qwix-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-1h49n2l66-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-bhlbog584-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-qlliozfar-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-na4nrhq01-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-hu1xiiemk-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-kfoblyedz-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-p4xvu4h8u-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-8vh67e7t3-adrhmnhkms-projects.vercel.app',
    'https://kasir-receipt-akxa30t1f-adrhmnhkms-projects.vercel.app',
    'https://kasir-receipt-lr165bnnm-adrhmnhkms-projects.vercel.app',
    'https://kasir-receipt-ing0omaqt-adrhmnhkms-projects.vercel.app',
    'https://kasir-receipt-6gumhynl3-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-2onde4li0-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-36mnvxcls-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-bky7a3gtk-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-dj4scyzr2-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-exo06l3so-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-ebilsroq0-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-j6c866vui-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-foanyk9ez-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-5w7ofkrc0-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-d0m690830-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-p8wndqr8t-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-6ffatcs2y-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-fue2fi54w-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-d1ehpj1vb-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-37t5ekmzc-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-crvbklqxh-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-7qfb0xggg-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-er7lic0x6-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-4f7rtf50t-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-7dxm5k8h4-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-4yhc3d9l4-adrhmnhkms-projects.vercel.app',
    'https://frontend-only-jj28m6p9h-adrhmnhkms-projects.vercel.app',
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