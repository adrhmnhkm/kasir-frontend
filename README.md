# Aplikasi Kasir V1.0

Aplikasi kasir modern dengan fitur Point of Sale (POS), manajemen inventori, dan laporan keuangan.

## Fitur Utama

- **Point of Sale (POS)**: Sistem kasir dengan keranjang belanja dan pembayaran
- **Manajemen Produk**: Tambah, edit, dan hapus produk dengan kategori
- **Manajemen Inventori**: Tracking stok dan pergerakan barang
- **Manajemen Kategori**: Organisasi produk berdasarkan kategori
- **Laporan Penjualan**: Analisis penjualan dan laporan keuangan
- **Manajemen Pengeluaran**: Tracking biaya operasional
- **Cetak Struk**: Sistem cetak struk otomatis

## Teknologi

- **Frontend**: React.js dengan Vite
- **Backend**: Node.js dengan Express
- **Database**: PostgreSQL (production) / SQLite (development)
- **Deployment**: Railway (backend) + Vercel (frontend)

## Instalasi

### Prerequisites
- Node.js 18+
- PostgreSQL (untuk production)
- pnpm

### Setup Development

1. Clone repository
```bash
git clone <repository-url>
cd aplikasi_kasir
```

2. Install dependencies
```bash
pnpm install
```

3. Setup environment variables
```bash
cp .env.example .env
# Edit .env dengan konfigurasi database
```

4. Run development server
```bash
# Backend
pnpm run dev:backend

# Frontend
pnpm run dev:frontend
```

## Deployment

Aplikasi ini menggunakan auto-deployment:
- **Backend**: Railway dengan GitHub integration
- **Frontend**: Vercel dengan GitHub integration

## Struktur Project

```
aplikasi_kasir/
├── src/backend/          # Backend API
├── frontend-only/        # Frontend React app
├── scripts/             # Utility scripts
└── docs/               # Dokumentasi
```

## Kontribusi

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## Lisensi

MIT License