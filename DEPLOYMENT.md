# Deployment Guide ke Vercel

## 📋 Prerequisites

1. **Database Cloud**: Aplikasi membutuhkan PostgreSQL database cloud karena Vercel tidak support SQLite
2. **Vercel Account**: Daftar di [vercel.com](https://vercel.com)
3. **Database Provider**: Pilih salah satu:
   - Vercel Postgres (Recommended)
   - Supabase PostgreSQL
   - PlanetScale MySQL
   - Railway PostgreSQL

## 🚀 Langkah Deployment

### 1. Setup Database Cloud

#### Opsi A: Vercel Postgres (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy project pertama kali
vercel

# Add Postgres database
vercel add postgres
```

#### Opsi B: Supabase (Gratis)
1. Daftar di [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string dari Settings > Database
4. Format: `postgresql://postgres:password@host:5432/postgres`

### 2. Environment Variables

Di Vercel Dashboard, tambahkan environment variables berikut:

```
NODE_ENV=production
POSTGRES_URL=your_postgres_connection_string
DATABASE_URL=your_postgres_connection_string
```

### 3. Deploy ke Vercel

```bash
# Method 1: Via CLI
vercel --prod

# Method 2: Via GitHub
# Push ke GitHub repository
# Connect repository di Vercel Dashboard
# Auto deploy on every push
```

### 4. Database Migration

Database tables akan otomatis dibuat saat first deployment.
Tapi Anda bisa manual setup dengan:

1. Connect ke database via psql atau GUI tool
2. Run SQL yang ada di `src/backend/database/postgres.js`

## 🔧 Local Development dengan PostgreSQL

1. Install PostgreSQL local atau gunakan Docker:
```bash
# Docker
docker run --name postgres-kasir -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Atau install PostgreSQL manual
```

2. Create `.env.local`:
```
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/kasir_db
```

3. Install dependencies dan run:
```bash
npm install
npm run dev
```

## 📊 Database Schema

Tables yang akan dibuat otomatis:
- `categories` - Kategori produk
- `products` - Data produk
- `sales` - Data penjualan
- `sale_items` - Detail item penjualan
- `expenses` - Data pengeluaran
- `stock_movements` - Pergerakan stok
- `settings` - Pengaturan aplikasi

## 🌐 Custom Domain (Opsional)

1. Di Vercel Dashboard > Settings > Domains
2. Add custom domain
3. Update DNS records sesuai instruksi Vercel

## 🔍 Troubleshooting

### Database Connection Error
- Pastikan environment variables sudah benar
- Check firewall/security groups di database provider
- Verify connection string format

### Build Errors
- Check Vercel build logs
- Pastikan semua dependencies ada di package.json
- Verify Node.js version compatibility

### API Endpoints Not Working
- Check vercel.json routing configuration
- Verify API routes di Vercel Functions tab
- Check serverless function limits (30s timeout)

## 📱 Features Available

✅ **Working di Vercel:**
- Point of Sale (POS)
- Product Management
- Inventory Management
- Sales Reporting
- Expense Tracking
- Accounting Dashboard

❌ **Limitations:**
- File uploads (karena serverless limitations)
- Large file processing
- Long-running tasks (>30s timeout)

## 💡 Tips

1. **Database Backup**: Setup automated backup di database provider
2. **Monitoring**: Enable Vercel Analytics untuk monitoring
3. **Performance**: Optimize queries untuk serverless environment
4. **Security**: Gunakan environment variables untuk semua credentials
