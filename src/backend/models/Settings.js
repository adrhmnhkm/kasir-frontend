const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use SQLite database
const dbPath = path.join(__dirname, '../../kasir.db');
const db = new sqlite3.Database(dbPath);

class Settings {
  static initialize() {
    return new Promise((resolve, reject) => {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      db.run(createTableQuery, (err) => {
        if (err) {
          reject(err);
        } else {
          // Insert default settings if table is empty
          this.insertDefaultSettings()
            .then(resolve)
            .catch(resolve); // Don't fail if defaults already exist
        }
      });
    });
  }

  static insertDefaultSettings() {
    return new Promise((resolve, reject) => {
      const defaultSettings = [
        ['store_name', 'Toko Saya'],
        ['store_address', 'Jl. Contoh No. 123, Kota'],
        ['store_phone', '081234567890'],
        ['store_email', 'info@tokosaya.com'],
        ['tax_rate', '0.11'],
        ['currency', 'IDR'],
        ['receipt_footer', 'Terima kasih atas kunjungan Anda']
      ];

      const insertQuery = 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)';
      
      let inserted = 0;
      defaultSettings.forEach(([key, value]) => {
        db.run(insertQuery, [key, value], function(err) {
          if (err) {
            console.error(`Error inserting setting ${key}:`, err);
          } else {
            inserted++;
          }
          
          if (inserted === defaultSettings.length) {
            resolve();
          }
        });
      });
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT key, value FROM settings';
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const settings = {};
          rows.forEach(row => {
            settings[row.key] = row.value;
          });
          resolve(settings);
        }
      });
    });
  }

  static get(key) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT value FROM settings WHERE key = ?';
      
      db.get(query, [key], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.value : null);
        }
      });
    });
  }

  static set(key, value) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [key, value], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  static updateMultiple(settings) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `;
      
      let updated = 0;
      const entries = Object.entries(settings);
      
      if (entries.length === 0) {
        resolve();
        return;
      }
      
      entries.forEach(([key, value]) => {
        db.run(query, [key, value], function(err) {
          if (err) {
            console.error(`Error updating setting ${key}:`, err);
          } else {
            updated++;
          }
          
          if (updated === entries.length) {
            resolve();
          }
        });
      });
    });
  }
}

module.exports = Settings; 