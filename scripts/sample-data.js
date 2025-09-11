const Database = require('better-sqlite3');
const db = new Database('kasir.db');

// Sample products data for PVC store
const sampleProducts = [
  // Pipa PVC
  {
    code: 'PVC001',
    name: 'Pipa PVC 1/2"',
    category_id: 1,
    purchase_price: 15000,
    selling_price: 18000,
    stock: 50,
    unit: 'batang',
    alt_unit: 'meter',
    alt_unit_conversion: 4,
    min_stock: 10,
    barcode: '8901234567890',
    description: 'Pipa PVC diameter 1/2 inch panjang 4 meter'
  },
  {
    code: 'PVC002',
    name: 'Pipa PVC 3/4"',
    category_id: 1,
    purchase_price: 22000,
    selling_price: 26000,
    stock: 30,
    unit: 'batang',
    alt_unit: 'meter',
    alt_unit_conversion: 4,
    min_stock: 10,
    barcode: '8901234567891',
    description: 'Pipa PVC diameter 3/4 inch panjang 4 meter'
  },
  {
    code: 'PVC003',
    name: 'Pipa PVC 1"',
    category_id: 1,
    purchase_price: 35000,
    selling_price: 42000,
    stock: 25,
    unit: 'batang',
    alt_unit: 'meter',
    alt_unit_conversion: 4,
    min_stock: 8,
    barcode: '8901234567892',
    description: 'Pipa PVC diameter 1 inch panjang 4 meter'
  },
  
  // Fitting PVC
  {
    code: 'FIT001',
    name: 'Elbow PVC 1/2"',
    category_id: 2,
    purchase_price: 3000,
    selling_price: 4500,
    stock: 100,
    unit: 'pcs',
    min_stock: 20,
    barcode: '8901234567893',
    description: 'Elbow PVC 90 derajat diameter 1/2 inch'
  },
  {
    code: 'FIT002',
    name: 'Tee PVC 1/2"',
    category_id: 2,
    purchase_price: 4000,
    selling_price: 6000,
    stock: 80,
    unit: 'pcs',
    min_stock: 15,
    barcode: '8901234567894',
    description: 'Tee PVC diameter 1/2 inch'
  },
  {
    code: 'FIT003',
    name: 'Socket PVC 1/2"',
    category_id: 2,
    purchase_price: 2500,
    selling_price: 3500,
    stock: 120,
    unit: 'pcs',
    min_stock: 25,
    barcode: '8901234567895',
    description: 'Socket PVC diameter 1/2 inch'
  },
  
  // Pipa Galvanis
  {
    code: 'GAL001',
    name: 'Pipa Galvanis 1/2"',
    category_id: 3,
    purchase_price: 45000,
    selling_price: 55000,
    stock: 20,
    unit: 'batang',
    alt_unit: 'meter',
    alt_unit_conversion: 6,
    min_stock: 5,
    barcode: '8901234567896',
    description: 'Pipa galvanis diameter 1/2 inch panjang 6 meter'
  },
  {
    code: 'GAL002',
    name: 'Pipa Galvanis 3/4"',
    category_id: 3,
    purchase_price: 65000,
    selling_price: 78000,
    stock: 15,
    unit: 'batang',
    alt_unit: 'meter',
    alt_unit_conversion: 6,
    min_stock: 5,
    barcode: '8901234567897',
    description: 'Pipa galvanis diameter 3/4 inch panjang 6 meter'
  },
  
  // Semen
  {
    code: 'SEM001',
    name: 'Semen Portland 40kg',
    category_id: 5,
    purchase_price: 58000,
    selling_price: 65000,
    stock: 100,
    unit: 'sak',
    min_stock: 20,
    barcode: '8901234567898',
    description: 'Semen Portland kemasan 40kg'
  },
  {
    code: 'SEM002',
    name: 'Semen Putih 40kg',
    category_id: 5,
    purchase_price: 68000,
    selling_price: 75000,
    stock: 50,
    unit: 'sak',
    min_stock: 10,
    barcode: '8901234567899',
    description: 'Semen putih kemasan 40kg'
  },
  
  // Cat
  {
    code: 'CAT001',
    name: 'Cat Tembok Putih 25kg',
    category_id: 6,
    purchase_price: 285000,
    selling_price: 320000,
    stock: 30,
    unit: 'pail',
    min_stock: 5,
    barcode: '8901234567900',
    description: 'Cat tembok warna putih kemasan 25kg'
  },
  {
    code: 'CAT002',
    name: 'Cat Kayu Coklat 1kg',
    category_id: 6,
    purchase_price: 45000,
    selling_price: 55000,
    stock: 25,
    unit: 'kaleng',
    min_stock: 5,
    barcode: '8901234567901',
    description: 'Cat kayu warna coklat kemasan 1kg'
  },
  
  // Alat
  {
    code: 'ALT001',
    name: 'Kunci Pipa 10"',
    category_id: 7,
    purchase_price: 75000,
    selling_price: 95000,
    stock: 10,
    unit: 'pcs',
    min_stock: 2,
    barcode: '8901234567902',
    description: 'Kunci pipa ukuran 10 inch'
  },
  {
    code: 'ALT002',
    name: 'Tang Potong 8"',
    category_id: 7,
    purchase_price: 45000,
    selling_price: 58000,
    stock: 15,
    unit: 'pcs',
    min_stock: 3,
    barcode: '8901234567903',
    description: 'Tang potong ukuran 8 inch'
  },
  
  // Lain-lain
  {
    code: 'LIN001',
    name: 'Lem PVC 100ml',
    category_id: 8,
    purchase_price: 12000,
    selling_price: 15000,
    stock: 60,
    unit: 'botol',
    min_stock: 15,
    barcode: '8901234567904',
    description: 'Lem PVC kemasan 100ml'
  },
  {
    code: 'LIN002',
    name: 'Isolasi Listrik',
    category_id: 8,
    purchase_price: 8000,
    selling_price: 12000,
    stock: 40,
    unit: 'roll',
    min_stock: 10,
    barcode: '8901234567905',
    description: 'Isolasi listrik warna hitam'
  }
];

// Insert sample data
const insertProduct = db.prepare(`
  INSERT INTO products (
    code, name, category_id, purchase_price, selling_price,
    stock, unit, alt_unit, alt_unit_conversion, min_stock, barcode, description
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

console.log('🔄 Menambahkan sample data produk...');

try {
  db.transaction(() => {
    sampleProducts.forEach(product => {
      insertProduct.run(
        product.code,
        product.name,
        product.category_id,
        product.purchase_price,
        product.selling_price,
        product.stock,
        product.unit,
        product.alt_unit || null,
        product.alt_unit_conversion || 1,
        product.min_stock,
        product.barcode,
        product.description
      );
    });
  })();

  console.log(`✅ Berhasil menambahkan ${sampleProducts.length} produk sample`);
  console.log('📦 Produk yang ditambahkan:');
  
  sampleProducts.forEach(product => {
    console.log(`   - ${product.code}: ${product.name}`);
  });
  
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    console.log('⚠️  Sample data sudah ada di database');
  } else {
    console.error('❌ Error menambahkan sample data:', error.message);
  }
}

db.close();
console.log('\n🚀 Silakan jalankan aplikasi dengan: pnpm start');
console.log('🌐 Buka browser di: http://localhost:3000'); 