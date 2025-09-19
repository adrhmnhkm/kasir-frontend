#!/usr/bin/env node

/**
 * Script untuk generate produk tambahan dengan barcode unik
 * Menjalankan: node scripts/generate-more-products.js
 */

const API_BASE_URL = 'https://backend-production-4a72.up.railway.app/api';

// Fungsi untuk generate barcode unik
function generateUniqueBarcode() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `8901234${timestamp.slice(-6)}${random}`;
}

// Data produk tambahan dengan barcode unik
const additionalProducts = [
  // Kategori Elektronik
  {
    code: 'ELC005',
    name: 'Lampu LED 5W',
    category_id: 1,
    purchase_price: 15000,
    selling_price: 25000,
    stock: 30,
    unit: 'pcs',
    min_stock: 8,
    barcode: generateUniqueBarcode(),
    description: 'Lampu LED 5W putih terang merek Philips'
  },
  {
    code: 'ELC006',
    name: 'Kabel USB Type-C',
    category_id: 1,
    purchase_price: 25000,
    selling_price: 40000,
    stock: 20,
    unit: 'pcs',
    min_stock: 5,
    barcode: generateUniqueBarcode(),
    description: 'Kabel USB Type-C 1 meter merek Anker'
  },
  {
    code: 'ELC007',
    name: 'Adaptor 5V 2A',
    category_id: 1,
    purchase_price: 35000,
    selling_price: 55000,
    stock: 15,
    unit: 'pcs',
    min_stock: 4,
    barcode: generateUniqueBarcode(),
    description: 'Adaptor 5V 2A merek Samsung'
  },

  // Kategori Makanan
  {
    code: 'MKN006',
    name: 'Susu UHT 1L',
    category_id: 2,
    purchase_price: 12000,
    selling_price: 18000,
    stock: 40,
    unit: 'kotak',
    min_stock: 10,
    barcode: generateUniqueBarcode(),
    description: 'Susu UHT 1 liter merek Ultra'
  },
  {
    code: 'MKN007',
    name: 'Roti Tawar',
    category_id: 2,
    purchase_price: 8000,
    selling_price: 12000,
    stock: 25,
    unit: 'bungkus',
    min_stock: 6,
    barcode: generateUniqueBarcode(),
    description: 'Roti tawar 400g merek Sari Roti'
  },
  {
    code: 'MKN008',
    name: 'Telur Ayam 1kg',
    category_id: 2,
    purchase_price: 25000,
    selling_price: 32000,
    stock: 20,
    unit: 'kg',
    min_stock: 5,
    barcode: generateUniqueBarcode(),
    description: 'Telur ayam segar 1kg'
  },

  // Kategori Pakaian
  {
    code: 'PKN003',
    name: 'Kaos Polos M',
    category_id: 3,
    purchase_price: 22000,
    selling_price: 32000,
    stock: 25,
    unit: 'pcs',
    min_stock: 6,
    barcode: generateUniqueBarcode(),
    description: 'Kaos polos ukuran M warna hitam'
  },
  {
    code: 'PKN004',
    name: 'Celana Training',
    category_id: 3,
    purchase_price: 80000,
    selling_price: 120000,
    stock: 18,
    unit: 'pcs',
    min_stock: 4,
    barcode: generateUniqueBarcode(),
    description: 'Celana training ukuran L warna abu-abu'
  },

  // Kategori Plastik
  {
    code: 'PLA004',
    name: 'Kantong Kresek Hitam',
    category_id: 4,
    purchase_price: 800,
    selling_price: 1500,
    stock: 300,
    unit: 'lembar',
    min_stock: 75,
    barcode: generateUniqueBarcode(),
    description: 'Kantong kresek hitam ukuran 30x40cm'
  },
  {
    code: 'PLA005',
    name: 'Plastik Makanan',
    category_id: 4,
    purchase_price: 12000,
    selling_price: 20000,
    stock: 35,
    unit: 'roll',
    min_stock: 8,
    barcode: generateUniqueBarcode(),
    description: 'Plastik makanan lebar 25cm panjang 20m'
  },

  // Produk tanpa kategori
  {
    code: 'GEN007',
    name: 'Pensil 2B',
    category_id: null,
    purchase_price: 1500,
    selling_price: 2500,
    stock: 120,
    unit: 'pcs',
    min_stock: 25,
    barcode: generateUniqueBarcode(),
    description: 'Pensil 2B merek Faber-Castell'
  },
  {
    code: 'GEN008',
    name: 'Penghapus Pensil',
    category_id: null,
    purchase_price: 2000,
    selling_price: 3500,
    stock: 90,
    unit: 'pcs',
    min_stock: 18,
    barcode: generateUniqueBarcode(),
    description: 'Penghapus pensil merek Faber-Castell'
  },
  {
    code: 'GEN009',
    name: 'Rautan Pensil',
    category_id: null,
    purchase_price: 5000,
    selling_price: 8000,
    stock: 60,
    unit: 'pcs',
    min_stock: 12,
    barcode: generateUniqueBarcode(),
    description: 'Rautan pensil merek Faber-Castell'
  },
  {
    code: 'GEN010',
    name: 'Tempat Pensil',
    category_id: null,
    purchase_price: 12000,
    selling_price: 20000,
    stock: 30,
    unit: 'pcs',
    min_stock: 6,
    barcode: generateUniqueBarcode(),
    description: 'Tempat pensil plastik transparan'
  },
  {
    code: 'GEN011',
    name: 'Lem Kertas',
    category_id: null,
    purchase_price: 8000,
    selling_price: 12000,
    stock: 40,
    unit: 'botol',
    min_stock: 8,
    barcode: generateUniqueBarcode(),
    description: 'Lem kertas 40ml merek UHU'
  },
  {
    code: 'GEN012',
    name: 'Gunting Kertas',
    category_id: null,
    purchase_price: 15000,
    selling_price: 25000,
    stock: 25,
    unit: 'pcs',
    min_stock: 5,
    barcode: generateUniqueBarcode(),
    description: 'Gunting kertas merek Fiskars'
  },
  {
    code: 'GEN013',
    name: 'Cutter Besar',
    category_id: null,
    purchase_price: 12000,
    selling_price: 20000,
    stock: 35,
    unit: 'pcs',
    min_stock: 7,
    barcode: generateUniqueBarcode(),
    description: 'Cutter besar merek Stanley'
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
        console.log('Response is not JSON, using status text');
      }
      throw new Error(errorMessage);
    }

    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.log('Response is not JSON but status is OK, creating mock result');
      result = {
        id: Date.now(),
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
async function generateAdditionalProducts() {
  console.log('🚀 Starting additional products generation...');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  
  // Check API health first
  const isHealthy = await checkAPIHealth();
  if (!isHealthy) {
    console.error('❌ API is not healthy. Exiting...');
    process.exit(1);
  }

  console.log(`\n📦 Generating ${additionalProducts.length} additional products...`);
  
  const results = {
    success: [],
    failed: []
  };

  for (let i = 0; i < additionalProducts.length; i++) {
    const product = additionalProducts[i];
    console.log(`\n[${i + 1}/${additionalProducts.length}] Creating: ${product.name} (${product.code})`);
    console.log(`   Barcode: ${product.barcode}`);
    
    try {
      const result = await createProduct(product);
      results.success.push({
        code: product.code,
        name: product.name,
        barcode: product.barcode,
        id: result.id
      });
      console.log(`✅ Success: ${product.name} created with ID ${result.id}`);
    } catch (error) {
      results.failed.push({
        code: product.code,
        name: product.name,
        barcode: product.barcode,
        error: error.message
      });
      console.log(`❌ Failed: ${product.name} - ${error.message}`);
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 ADDITIONAL PRODUCTS GENERATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successfully created: ${results.success.length} products`);
  console.log(`❌ Failed to create: ${results.failed.length} products`);
  
  if (results.success.length > 0) {
    console.log('\n✅ SUCCESSFUL PRODUCTS:');
    results.success.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (${item.code}) - Barcode: ${item.barcode} - ID: ${item.id}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED PRODUCTS:');
    results.failed.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (${item.code}) - Barcode: ${item.barcode} - Error: ${item.error}`);
    });
  }

  console.log('\n🎉 Additional products generation completed!');
  
  if (results.success.length > 0) {
    console.log(`\n💡 You can now check the products in your application at:`);
    console.log(`   Frontend: https://frontend-only-tau.vercel.app`);
    console.log(`   API Products: ${API_BASE_URL}/products`);
  }
}

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  generateAdditionalProducts().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { generateAdditionalProducts, additionalProducts };

