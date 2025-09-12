// Database adapter that switches between SQLite and PostgreSQL
const hasPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;

console.log('🔍 Database configuration check:');
console.log('  POSTGRES_URL:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  hasPostgres:', hasPostgres ? 'TRUE' : 'FALSE');

let db;

if (hasPostgres) {
  // Always use PostgreSQL when connection string is provided (e.g., Railway)
  console.log('🐘 Using PostgreSQL database');
  db = require('./postgres');
} else {
  // Use SQLite fallback (local development only)
  console.log('📱 Using SQLite database (fallback)');
  
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
          .replace(/STRING_AGG\((.*?),\s*',\s*'\)/g, 'GROUP_CONCAT($1)') // Convert STRING_AGG to GROUP_CONCAT
          .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT') // Convert SERIAL to AUTOINCREMENT
          .replace(/TIMESTAMP WITH TIME ZONE DEFAULT NOW\(\)/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
          .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
        
        // Detect query type
        const sqlLower = sqliteQuery.toLowerCase().trim();
        
        if (sqlLower.startsWith('select')) {
          sqliteDb.all(sqliteQuery, params, (err, rows) => {
            if (err) {
              console.error('SQLite SELECT error:', err);
              reject(err);
            } else {
              resolve({ rows: rows || [] });
            }
          });
        } else if (sqlLower.startsWith('insert')) {
          // Handle INSERT with RETURNING clause
          if (sqliteQuery.includes('RETURNING')) {
            // Remove RETURNING clause and get the inserted ID
            const insertQuery = sqliteQuery.replace(/RETURNING \*/g, '');
            sqliteDb.run(insertQuery, params, function(err) {
              if (err) {
                console.error('SQLite INSERT error:', err);
                reject(err);
              } else {
                // Get the inserted record
                const tableName = sqliteQuery.match(/INSERT INTO (\w+)/i)[1];
                const selectQuery = `SELECT * FROM ${tableName} WHERE id = ?`;
                sqliteDb.get(selectQuery, [this.lastID], (err, row) => {
                  if (err) {
                    console.error('SQLite SELECT after INSERT error:', err);
                    reject(err);
                  } else {
                    resolve({ 
                      rows: row ? [row] : [],
                      lastID: this.lastID,
                      changes: this.changes 
                    });
                  }
                });
              }
            });
          } else {
            sqliteDb.run(sqliteQuery, params, function(err) {
              if (err) {
                console.error('SQLite INSERT error:', err);
                reject(err);
              } else {
                resolve({ 
                  rows: [{ id: this.lastID }],
                  lastID: this.lastID,
                  changes: this.changes 
                });
              }
            });
          }
        } else {
          // Handle UPDATE with RETURNING clause
          if (sqliteQuery.includes('RETURNING')) {
            // Remove RETURNING clause and get the updated record
            const updateQuery = sqliteQuery.replace(/RETURNING \*/g, '');
            sqliteDb.run(updateQuery, params, function(err) {
              if (err) {
                console.error('SQLite UPDATE error:', err);
                reject(err);
              } else if (this.changes === 0) {
                resolve({ rows: [], changes: 0 });
              } else {
                // Get the updated record (assuming WHERE id = ? is the last parameter)
                const tableName = sqliteQuery.match(/UPDATE (\w+)/i)[1];
                const idParam = params[params.length - 1];
                const selectQuery = `SELECT * FROM ${tableName} WHERE id = ?`;
                sqliteDb.get(selectQuery, [idParam], (err, row) => {
                  if (err) {
                    console.error('SQLite SELECT after UPDATE error:', err);
                    reject(err);
                  } else {
                    resolve({ 
                      rows: row ? [row] : [],
                      changes: this.changes 
                    });
                  }
                });
              }
            });
          } else {
            sqliteDb.run(sqliteQuery, params, function(err) {
              if (err) {
                console.error('SQLite UPDATE error:', err);
                reject(err);
              } else {
                resolve({ 
                  rows: [],
                  changes: this.changes 
                });
              }
            });
          }
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
