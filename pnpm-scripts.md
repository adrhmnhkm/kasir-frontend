# Script Commands untuk Aplikasi Kasir

## Menjalankan Aplikasi

### Development Mode
```bash
pnpm run dev
```
- Menjalankan server dengan auto-restart menggunakan nodemon
- Server akan restart otomatis setiap kali ada perubahan file

### Production Mode
```bash
pnpm start
```
- Menjalankan server tanpa auto-restart
- Cocok untuk production environment

## Database Management

### Backup Database
```bash
pnpm run backup
```
- Membuat backup database SQLite
- File backup disimpan di folder `backups/`
- Format nama: `kasir_backup_YYYY-MM-DD_HH-mm-ss.db`
- Otomatis hapus backup lama (simpan 10 backup terakhir)

### Restore Database
```bash
node scripts/restore.js
```
- Mengembalikan database dari file backup
- Pilih file backup yang ingin dikembalikan
- Database saat ini akan dibackup sebelum restore

### Sample Data
```bash
node scripts/sample-data.js
```
- Menambahkan data sample produk untuk testing
- Berisi 16 produk berbagai kategori
- Aman dijalankan berulang kali (tidak akan duplikasi)

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Tambah sample data (opsional):**
   ```bash
   node scripts/sample-data.js
   ```

3. **Jalankan aplikasi:**
   ```bash
   pnpm run dev
   ```

4. **Buka browser:**
   ```
   http://localhost:3000
   ```

## Troubleshooting

### Better-SQLite3 Build Issues
Jika ada masalah dengan better-sqlite3:
```bash
# Install ulang dengan native build
pnpm install better-sqlite3 --config.native-build=true

# Atau rebuild
pnpm rebuild better-sqlite3
```

### Database Corrupt
Jika database corrupt:
```bash
# Backup database yang corrupt
cp kasir.db kasir_corrupt.db

# Restore dari backup terakhir
node scripts/restore.js
```

### Port Sudah Digunakan
Jika port 3000 sudah digunakan:
```bash
# Set port lain via environment variable
PORT=3001 pnpm start
```

## File Structure
```
aplikasi_kasir/
├── server.js              # Main server file
├── package.json           # Dependencies & scripts
├── kasir.db              # SQLite database (auto-created)
├── public/
│   ├── index.html        # Main application
│   └── receipt.html      # Receipt template
├── scripts/
│   ├── backup.js         # Database backup
│   ├── restore.js        # Database restore
│   └── sample-data.js    # Sample data generator
└── backups/              # Database backups (auto-created)
``` 