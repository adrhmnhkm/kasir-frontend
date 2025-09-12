const Category = require('../models/Category');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Sale = require('../models/Sale');
const Settings = require('../models/Settings');
const Expense = require('../models/Expense');
const path = require('path');
const fs = require('fs');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // If Postgres is configured, ensure tables exist before model init
    const hasPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (hasPostgres) {
      console.log('🐘 Detected Postgres configuration. Ensuring tables exist...');
      const postgres = require('../database/postgres');
      await postgres.initializeTables();
      console.log('✅ Postgres tables ensured');
    }
    
    // Initialize Categories table and data
    console.log('📋 Setting up categories...');
    await Category.initialize();
    console.log('✅ Categories initialized');
    
    // Initialize Products table and data
    console.log('📦 Setting up products...');
    await Product.initialize();
    console.log('✅ Products initialized');
    
    // Initialize StockMovements table
    console.log('📊 Setting up stock movements...');
    await StockMovement.initialize();
    console.log('✅ Stock movements initialized');
    
    // Initialize Sales table
    console.log('💰 Setting up sales...');
    await Sale.initialize();
    console.log('✅ Sales initialized');
    
    // Initialize Expenses table
    console.log('💸 Setting up expenses...');
    await Expense.initialize();
    console.log('✅ Expenses initialized');
    
    // Initialize Settings table
    console.log('⚙️ Setting up settings...');
    await Settings.initialize();
    console.log('✅ Settings initialized');
    
    console.log('🎉 Database initialization completed successfully!');
    
    // Skip data counting during startup to avoid race conditions
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Check if database file exists
function checkDatabaseFile() {
  const dbPath = path.join(__dirname, '../../kasir.db');
  const exists = fs.existsSync(dbPath);
  
  if (!exists) {
    console.log('📁 Database file does not exist, will be created automatically');
  } else {
    console.log('📁 Database file found at:', dbPath);
  }
  
  return { exists, path: dbPath };
}

module.exports = {
  initializeDatabase,
  checkDatabaseFile
}; 