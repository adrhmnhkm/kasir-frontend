#!/usr/bin/env node

/**
 * Script untuk generate 20 dummy produk via API
 * Menjalankan: node scripts/generate-dummy-products.js
 */

const API_BASE_URL = 'https://backend-production-4a72.up.railway.app/api';

// Data dummy produk yang beragam - menggunakan kategori yang ada di database
const dummyProducts = [
  // Kategori Elektronik (ID: 1)
  {
    code: 'ELC001',
    name: 'Kabel Listrik 2.5mm',
    category_id: 1,
    purchase_price: 15000,
    selling_price: 20000,
    stock: 50,
    unit: 'meter',
    min_stock: 10,
    barcode: '8901234567910',
    description: 'Kabel listrik NYA 2.5mm per meter'
  },
  {
    code: 'ELC002',
    name: 'Kabel Listrik 4mm',
    category_id: 1,
    purchase_price: 25000,
    selling_price: 32000,
    stock: 30,
    unit: 'meter',
    min_stock: 8,
    barcode: '8901234567911',
    description: 'Kabel listrik NYA 4mm per meter'
  },
  {
    code: 'ELC003',
    name: 'Stop Kontak 2 Lubang',
    category_id: 1,
    purchase_price: 12000,
    selling_price: 18000,
    stock: 25,
    unit: 'pcs',
    min_stock: 5,
    barcode: '8901234567912',
    description: 'Stop kontak 2 lubang merek Panasonic'
  },
  {
    code: 'ELC004',
    name: 'Saklar Tunggal',
    category_id: 1,
    purchase_price: 8000,
    selling_price: 12000,
    stock: 40,
    unit: 'pcs',
    min_stock: 10,
    barcode: '8901234567913',
    description: 'Saklar tunggal merek Panasonic'
  },

  // Kategori Makanan (ID: 2)
  {
    code: 'MKN001',
    name: 'Mie Instan Indomie',
    category_id: 2,
    purchase_price: 2500,
    selling_price: 3500,
    stock: 100,
    unit: 'bungkus',
    min_stock: 20,
    barcode: '8901234567914',
    description: 'Mie instan Indomie rasa ayam bawang'
  },
  {
    code: 'MKN002',
    name: 'Beras Premium 5kg',
    category_id: 2,
    purchase_price: 65000,
    selling_price: 75000,
    stock: 20,
    unit: 'karung',
    min_stock: 5,
    barcode: '8901234567915',
    description: 'Beras premium 5kg merek Pandanwangi'
  },
  {
    code: 'MKN003',
    name: 'Minyak Goreng 1L',
    category_id: 2,
    purchase_price: 18000,
    selling_price: 22000,
    stock: 30,
    unit: 'botol',
    min_stock: 8,
    barcode: '8901234567916',
    description: 'Minyak goreng 1 liter merek Bimoli'
  },
  {
    code: 'MKN004',
    name: 'Gula Pasir 1kg',
    category_id: 2,
    purchase_price: 12000,
    selling_price: 15000,
    stock: 25,
    unit: 'bungkus',
    min_stock: 6,
    barcode: '8901234567917',
    description: 'Gula pasir 1kg merek Gulaku'
  },
  {
    code: 'MKN005',
    name: 'Teh Celup 25s',
    category_id: 2,
    purchase_price: 8000,
    selling_price: 12000,
    stock: 50,
    unit: 'kotak',
    min_stock: 12,
    barcode: '8901234567918',
    description: 'Teh celup 25 sachet merek Teh Botol Sosro'
  },

  // Kategori Pakaian (ID: 3)
  {
    code: 'PKN001',
    name: 'Kaos Polos L',
    category_id: 3,
    purchase_price: 25000,
    selling_price: 35000,
    stock: 20,
    unit: 'pcs',
    min_stock: 5,
    barcode: '8901234567919',
    description: 'Kaos polos ukuran L warna putih'
  },
  {
    code: 'PKN002',
    name: 'Celana Jeans 32',
    category_id: 3,
    purchase_price: 120000,
    selling_price: 180000,
    stock: 15,
    unit: 'pcs',
    min_stock: 3,
    barcode: '8901234567920',
    description: 'Celana jeans ukuran 32 warna biru'
  },

  // Kategori Plastik (ID: 4)
  {
    code: 'PLA001',
    name: 'Kantong Plastik Kecil',
    category_id: 4,
    purchase_price: 500,
    selling_price: 1000,
    stock: 200,
    unit: 'lembar',
    min_stock: 50,
    barcode: '8901234567921',
    description: 'Kantong plastik kecil ukuran 20x30cm'
  },
  {
    code: 'PLA002',
    name: 'Kantong Plastik Besar',
    category_id: 4,
    purchase_price: 1000,
    selling_price: 2000,
    stock: 150,
    unit: 'lembar',
    min_stock: 30,
    barcode: '8901234567922',
    description: 'Kantong plastik besar ukuran 40x50cm'
  },
  {
    code: 'PLA003',
    name: 'Plastik Wrap 30cm',
    category_id: 4,
    purchase_price: 15000,
    selling_price: 25000,
    stock: 25,
    unit: 'roll',
    min_stock: 6,
    barcode: '8901234567923',
    description: 'Plastik wrap lebar 30cm panjang 30m'
  },

  // Produk tanpa kategori (null category_id)
  {
    code: 'GEN001',
    name: 'Pulpen Hitam',
    category_id: null,
    purchase_price: 2000,
    selling_price: 3000,
    stock: 100,
    unit: 'pcs',
    min_stock: 20,
    barcode: '8901234567924',
    description: 'Pulpen hitam merek Standard'
  },
  {
    code: 'GEN002',
    name: 'Buku Tulis 38 Lembar',
    category_id: null,
    purchase_price: 5000,
    selling_price: 8000,
    stock: 50,
    unit: 'buah',
    min_stock: 10,
    barcode: '8901234567925',
    description: 'Buku tulis 38 lembar merek Sinar Dunia'
  },
  {
    code: 'GEN003',
    name: 'Penghapus Karet',
    category_id: null,
    purchase_price: 1000,
    selling_price: 2000,
    stock: 80,
    unit: 'pcs',
    min_stock: 15,
    barcode: '8901234567926',
    description: 'Penghapus karet putih merek Faber-Castell'
  },
  {
    code: 'GEN004',
    name: 'Penggaris 30cm',
    category_id: null,
    purchase_price: 3000,
    selling_price: 5000,
    stock: 40,
    unit: 'pcs',
    min_stock: 8,
    barcode: '8901234567927',
    description: 'Penggaris plastik 30cm transparan'
  },
  {
    code: 'GEN005',
    name: 'Stapler Kecil',
    category_id: null,
    purchase_price: 15000,
    selling_price: 25000,
    stock: 20,
    unit: 'pcs',
    min_stock: 4,
    barcode: '8901234567928',
    description: 'Stapler kecil merek Max'
  },
  {
    code: 'GEN006',
    name: 'Isi Stapler 1000',
    category_id: null,
    purchase_price: 8000,
    selling_price: 12000,
    stock: 30,
    unit: 'box',
    min_stock: 6,
    barcode: '8901234567929',
    description: 'Isi stapler 1000 pcs ukuran 26/6'
  }
];

// Fungsi untuk membuat request ke API
async function createProduct(productData) {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = `HTTP ${response.status}: ${errorData.error || response.statusText}`;
      } catch (parseError) {
        // If response is not JSON, use status text
        console.log('Response is not JSON, using status text');
      }
      throw new Error(errorMessage);
    }

    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      // If response is not JSON but status is OK, create a mock result
      console.log('Response is not JSON but status is OK, creating mock result');
      result = {
        id: Date.now(), // Use timestamp as ID
        ...productData,
        created_at: new Date().toISOString()
      };
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}

// Fungsi untuk mengecek koneksi API
async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`API Health check failed: ${response.status}`);
    }
    const data = await response.json();
    console.log('✅ API Health Check:', data);
    return true;
  } catch (error) {
    console.error('❌ API Health Check failed:', error.message);
    return false;
  }
}

// Fungsi utama untuk generate produk
async function generateDummyProducts() {
  console.log('🚀 Starting dummy products generation...');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  
  // Check API health first
  const isHealthy = await checkAPIHealth();
  if (!isHealthy) {
    console.error('❌ API is not healthy. Exiting...');
    process.exit(1);
  }

  console.log(`\n📦 Generating ${dummyProducts.length} dummy products...`);
  
  const results = {
    success: [],
    failed: []
  };

  for (let i = 0; i < dummyProducts.length; i++) {
    const product = dummyProducts[i];
    console.log(`\n[${i + 1}/${dummyProducts.length}] Creating: ${product.name} (${product.code})`);
    
    try {
      const result = await createProduct(product);
      results.success.push({
        code: product.code,
        name: product.name,
        id: result.id
      });
      console.log(`✅ Success: ${product.name} created with ID ${result.id}`);
    } catch (error) {
      results.failed.push({
        code: product.code,
        name: product.name,
        error: error.message
      });
      console.log(`❌ Failed: ${product.name} - ${error.message}`);
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully created: ${results.success.length} products`);
  console.log(`❌ Failed to create: ${results.failed.length} products`);
  
  if (results.success.length > 0) {
    console.log('\n✅ SUCCESSFUL PRODUCTS:');
    results.success.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (${item.code}) - ID: ${item.id}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED PRODUCTS:');
    results.failed.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (${item.code}) - Error: ${item.error}`);
    });
  }

  console.log('\n🎉 Dummy products generation completed!');
  
  if (results.success.length > 0) {
    console.log(`\n💡 You can now check the products in your application at:`);
    console.log(`   Frontend: https://frontend-only-tau.vercel.app`);
    console.log(`   API Products: ${API_BASE_URL}/products`);
  }
}

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  generateDummyProducts().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { generateDummyProducts, dummyProducts };
