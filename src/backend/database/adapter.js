// Database adapter that switches between SQLite and PostgreSQL
const isProduction = process.env.NODE_ENV === 'production';
const hasPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let db;

if (isProduction && hasPostgres) {
  // Use PostgreSQL for production
  console.log('🐘 Using PostgreSQL database for production');
  db = require('./postgres');
} else {
  // Use SQLite for development
  console.log('📱 Using SQLite database for development');
  
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  const dbPath = path.join(__dirname, '../../kasir.db');
  const sqliteDb = new sqlite3.Database(dbPath);
  
  // Wrap SQLite in Promise-based interface similar to PostgreSQL
  db = {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        // Convert PostgreSQL syntax to SQLite
        let sqliteQuery = sql
          .replace(/\$(\d+)/g, '?')  // Replace $1, $2, etc. with ?
          .replace(/::date/g, '')    // Remove ::date casting
          .replace(/STRING_AGG\((.*?),\s*',\s*'\)/g, 'GROUP_CONCAT($1)'); // Convert STRING_AGG to GROUP_CONCAT
        
        // Detect query type
        const sqlLower = sqliteQuery.toLowerCase().trim();
        
        if (sqlLower.startsWith('select')) {
          sqliteDb.all(sqliteQuery, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows });
          });
        } else if (sqlLower.startsWith('insert')) {
          sqliteDb.run(sqliteQuery, params, function(err) {
            if (err) reject(err);
            else resolve({ 
              rows: [{ id: this.lastID }],
              lastID: this.lastID,
              changes: this.changes 
            });
          });
        } else {
          sqliteDb.run(sqliteQuery, params, function(err) {
            if (err) reject(err);
            else resolve({ 
              rows: [],
              changes: this.changes 
            });
          });
        }
      });
    },
    
    testConnection: async () => {
      return new Promise((resolve) => {
        sqliteDb.get('SELECT 1', (err) => {
          if (err) {
            console.error('❌ SQLite connection failed:', err.message);
            resolve(false);
          } else {
            console.log('✅ Connected to SQLite database');
            resolve(true);
          }
        });
      });
    },
    
    initializeTables: async () => {
      // SQLite tables are already initialized via existing utils
      const initializeDatabase = require('../utils/initializeDatabase');
      await initializeDatabase();
    }
  };
}

module.exports = db;
