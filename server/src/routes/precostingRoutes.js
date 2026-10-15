import express from 'express';
import { precostingStore } from '../db/precostingStore.js';

const router = express.Router();

// GET /api/precostings - List with search, filter, sort
router.get('/', async (req, res) => {
  try {
    const { search, status, sortBy } = req.query;
    const items = await precostingStore.getAll({ search, status, sortBy });
    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/precostings/populate - Populate "PrecostingHeader" table
router.post('/populate', async (req, res) => {
  try {
    const customItems = req.body?.items;
    const populated = await precostingStore.populateHeader(customItems);
    res.json({
      success: true,
      message: `Berhasil melakukan populate ${populated.length} data ke tabel "PrecostingHeader"`,
      count: populated.length,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/precostings/header-mapping - Metadata pemetaan kolom PrecostingHeader ke Grid UI
router.get('/header-mapping', (req, res) => {
  res.json({
    success: true,
    table: 'PrecostingHeader',
    database: 'cloth_precosting_portal',
    description: 'Pemetaan kolom tabel database "PrecostingHeader" (PostgreSQL) ke kolom Grid UI Dashboard',
    mapping: [
      { gridIndex: 1, gridColumn: 'Nomor Precosting', dbColumn: 'PrecostingNo / id', type: 'VARCHAR(50) / BIGINT', description: 'Nomor Precosting (misal PC-2026-001) atau ID record' },
      { gridIndex: 2, gridColumn: 'Image', dbColumn: 'ProductImage', type: 'TEXT', description: 'URL / path / gambar produk model pakaian' },
      { gridIndex: 3, gridColumn: 'Qty Produksi', dbColumn: 'ProdQty', type: 'REAL', description: 'Target kuantitas pesanan produksi pakaian (Pcs)' },
      { gridIndex: 4, gridColumn: 'Nama Style', dbColumn: 'ProdName', type: 'VARCHAR(255)', description: 'Nama item / style pakaian' },
      { gridIndex: 5, gridColumn: 'Consm', dbColumn: 'Consume', type: 'REAL', description: 'Konsumsi pemakaian bahan kain utama per pcs (misal 1.85)' },
      { gridIndex: 6, gridColumn: 'Harga Fabric', dbColumn: 'FabricPrice', type: 'REAL', description: 'Harga satuan kain per meter / kg' },
      { gridIndex: 7, gridColumn: 'Total Kain (Harga Fabric * Consm)', dbColumn: 'TotalFabricPrice', type: 'REAL', description: 'Hasil kalkulasi otomatis (Consume * FabricPrice)' },
      { gridIndex: 8, gridColumn: 'Harga CMT (Total Jasa)', dbColumn: 'CMTPrice', type: 'REAL', description: 'Total biaya seluruh jasa (cutting, sewing, finishing, dll)' },
      { gridIndex: 9, gridColumn: 'Harga Accesories', dbColumn: 'AccPrice', type: 'REAL', description: 'Total biaya aksesoris & trims per pcs' },
      { gridIndex: 10, gridColumn: 'HPP', dbColumn: 'HPP', type: 'REAL', description: 'Harga Pokok Produksi per pcs' },
      { gridIndex: 11, gridColumn: 'PPN', dbColumn: 'TaxPrice', type: 'REAL', description: 'Pajak Pertambahan Nilai 11% (HPP * 11%)' },
      { gridIndex: 12, gridColumn: 'Action', dbColumn: 'Status', type: 'VARCHAR(50)', description: 'Status (Pending Approval, Approved, Revision, Draft) dan tombol aksi (Detail, Approve, Not Approve)' },
    ],
  });
});

// GET /api/precostings/:id - Get one precosting detail
router.get('/:id', async (req, res) => {
  try {
    const item = await precostingStore.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Precosting tidak ditemukan' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/precostings - Create new precosting
router.post('/', async (req, res) => {
  try {
    const raw = req.body || {};
    // Support PascalCase (PrecostingNo, ProdName), camelCase (precostingNo, itemName), and snake_case
    const precostingNo = raw.PrecostingNo || raw.precostingNo || raw.precosting_no || raw.id;
    const itemName = raw.ProdName || raw.prodName || raw.prod_name || raw.itemName || raw.item_name || raw.ItemName;

    if (!precostingNo && !itemName) {
      return res.status(400).json({
        success: false,
        message: 'Nomor Precosting (PrecostingNo) atau Nama Produk (ProdName) wajib diisi.',
      });
    }

    const created = await precostingStore.create(raw);
    res.status(201).json({
      success: true,
      message: `Precosting ${created.precostingNo} berhasil disimpan ke database`,
      data: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/precostings/:id - Update precosting
router.put('/:id', async (req, res) => {
  try {
    const updated = await precostingStore.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Precosting tidak ditemukan' });
    }
    res.json({
      success: true,
      message: `Precosting ${updated.precostingNo} berhasil diperbarui`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/precostings/:id - Delete precosting
router.delete('/:id', async (req, res) => {
  try {
    const success = await precostingStore.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Precosting tidak ditemukan' });
    }
    res.json({ success: true, message: 'Precosting berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/precostings/:id/approve - Approve precosting
router.post('/:id/approve', async (req, res) => {
  try {
    const { approverName, notes } = req.body;
    const updated = await precostingStore.approve(req.params.id, {
      approverName: approverName || 'Authorized Manager',
      notes: notes || '',
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Precosting tidak ditemukan' });
    }

    res.json({
      success: true,
      message: `Precosting ${updated.precostingNo} berhasil disetujui (Approved)`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/precostings/:id/reject - Reject / Request Revision
router.post('/:id/reject', async (req, res) => {
  try {
    const { reviewerName, notes } = req.body;
    const updated = await precostingStore.reject(req.params.id, {
      reviewerName: reviewerName || 'Reviewer',
      notes: notes || '',
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Precosting tidak ditemukan' });
    }

    res.json({
      success: true,
      message: `Status Precosting ${updated.precostingNo} diubah menjadi Perlu Revisi`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/precostings/:id/remarks - Add remark
router.post('/:id/remarks', async (req, res) => {
  try {
    const { author, role, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Teks catatan/remarks tidak boleh kosong' });
    }

    const updated = await precostingStore.addRemark(req.params.id, {
      author: author || 'System User',
      role: role || 'Merchandiser',
      text: text.trim(),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Precosting tidak ditemukan' });
    }

    res.status(201).json({
      success: true,
      message: 'Catatan/remarks berhasil ditambahkan',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
