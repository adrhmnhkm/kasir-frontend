const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Penerimaan Barang
router.post('/penerimaan-barang', inventoryController.penerimaanBarang);

// Penyesuaian Stok
router.post('/penyesuaian-stok', inventoryController.penyesuaianStok);

// Barang Rusak/Expired
router.post('/barang-rusak', inventoryController.barangRusak);

// Laporan Stok Menipis
router.get('/stok-menipis', inventoryController.laporanStokMenipis);

// Riwayat Pergerakan Stok
router.get('/pergerakan-stok', inventoryController.riwayatPergerakanStok);

// Laporan Nilai Stok
router.get('/nilai-stok', inventoryController.laporanNilaiStok);

module.exports = router; 