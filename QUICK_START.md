# 🚀 Quick Start - Aplikasi Kasir PVC

## ⚡ Menjalankan Aplikasi

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Jalankan server:**
   ```bash
   # Development mode (auto-restart)
   pnpm run dev
   
   # Production mode
   pnpm start
   ```

3. **Buka browser:**
   ```
   http://localhost:3000
   ```

## 🎯 Fitur yang Tersedia

### ✅ Point of Sale (POS)
- Interface kasir yang responsif
- Pencarian produk dan scan barcode
- Keranjang belanja dengan kalkulasi otomatis
- Diskon per item
- Simpan draft transaksi
- Cetak struk (preview)

### ✅ Manajemen Produk
- CRUD produk lengkap
- Kategori produk
- Multi satuan (batang/meter, pcs/lusin, dll)
- Pencarian dan filter
- Notifikasi stok menipis

### ✅ Riwayat Penjualan
- Daftar transaksi
- Detail penjualan
- Status draft/selesai

### 🔄 In Development
- Laporan lengkap
- Manajemen pembelian
- Customer & supplier
- Thermal printer integration

## 📦 Sample Data

Aplikasi sudah dilengkapi dengan sample data:
- **6 produk** dari berbagai kategori (Pipa PVC, Fitting, Semen, Cat, dll)
- **8 kategori** produk
- Data disimpan dalam memory (akan hilang saat restart)

## 🛠️ Struktur Aplikasi

```
aplikasi_kasir/
├── server-simple.js      # Main server (in-memory database)
├── server.js            # SQLite version (untuk production)
├── public/
│   ├── index.html       # Main application (React + Tailwind)
│   └── receipt.html     # Receipt template
├── scripts/
│   ├── backup.js        # Database backup
│   ├── restore.js       # Database restore
│   └── sample-data.js   # Sample data generator
└── package.json         # Dependencies & scripts
```

## 🎮 Cara Penggunaan

### 1. Menu POS (Point of Sale)
1. Klik menu **"Point of Sale"**
2. Ketik nama/kode produk atau scan barcode
3. Klik produk untuk menambah ke keranjang
4. Atur quantity dan diskon jika perlu
5. Klik **"Hitung"** untuk pembayaran
6. Masukkan jumlah bayar
7. Klik **"Bayar"** untuk menyelesaikan transaksi

### 2. Menu Produk
1. Klik menu **"Produk"**
2. Klik **"+ Tambah Produk"** untuk produk baru
3. Gunakan pencarian dan filter kategori
4. Klik icon edit/hapus untuk mengelola produk

### 3. Menu Penjualan
1. Klik menu **"Penjualan"**
2. Lihat riwayat semua transaksi
3. Status menunjukkan Draft atau Selesai

## 🔧 Troubleshooting

### Port Already in Use
Jika ada error `EADDRINUSE`:
```bash
# Hentikan proses yang menggunakan port 3000
lsof -ti:3000 | xargs kill -9
# Atau gunakan port lain
PORT=3001 pnpm start
```

### Memory Full
Aplikasi menggunakan in-memory database, restart server untuk reset data:
```bash
# Ctrl+C untuk stop, lalu
pnpm start
```

## 📱 Teknologi

- **Backend:** Node.js + Express
- **Frontend:** React 18 (via CDN) + Tailwind CSS
- **Database:** In-memory (demo) / SQLite (production)
- **Icons:** Font Awesome
- **Package Manager:** pnpm

## 🎯 Production Setup

Untuk production dengan SQLite database persisten:
1. Install `better-sqlite3` atau `sqlite3`
2. Gunakan `server.js` instead of `server-simple.js`
3. Jalankan `node scripts/sample-data.js` untuk sample data
4. Setup thermal printer integration

---

**🏪 Aplikasi Kasir PVC & Bahan Bangunan - Ready to Use!** 