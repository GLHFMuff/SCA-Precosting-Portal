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
      { gridIndex: 2, gridColumn: 'Image', dbColumn: 'ProductImage / ProdImage_base64', type: 'TEXT', description: 'URL / path / gambar produk model pakaian (Base64 string)' },
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

// Handler Query Precosting Berdasarkan Status (Mendukung HTTP POST & GET)
// Memungkinkan aplikasi utama yang menggunakan C# HttpWebRequest (Method = "POST") mengambil data dengan filter status.
// Logika parameter 'status' (bisa di JSON body atau query string URL):
// - Jika status kosong ("" / null / undefined / whitespace): otomatis mengambil status 'confirm' DAN 'reject' (tanpa pending/draft)
// - Jika diisi "reject" (atau "rejected", "revision"): mengambil hanya yang status reject
// - Jika diisi "confirm" (atau "confirmed", "approved"): mengambil hanya yang status confirm
// - Jika diisi "all" / "ALL": mengambil seluruh data precosting
export const handleQueryPrecostingsByStatus = async (req, res) => {
  try {
    const raw = req.body || {};
    const rawStatus = raw.status ?? raw.Status ?? req.query?.status;

    let effectiveStatus;
    if (rawStatus === undefined || rawStatus === null || String(rawStatus).trim() === '') {
      // Sesuai requirement: jika kosong, ambil yang reject dan confirm
      effectiveStatus = 'confirm,reject';
    } else {
      const s = String(rawStatus).trim();
      const lower = s.toLowerCase();
      if (lower === 'confirm,reject' || lower === 'confirm-reject' || lower === 'processed' || lower === 'both') {
        effectiveStatus = 'confirm,reject';
      } else if (lower === 'all' || lower === 'semua') {
        effectiveStatus = 'ALL';
      } else {
        effectiveStatus = s;
      }
    }

    const search = raw.search ?? raw.Search ?? req.query?.search ?? '';
    const sortBy = raw.sortBy ?? raw.SortBy ?? req.query?.sortBy ?? 'date-desc';

    const items = await precostingStore.getStatusSummary({
      status: effectiveStatus,
      search,
      sortBy,
    });

    const isBoth = effectiveStatus === 'confirm,reject';
    const desc = isBoth
      ? 'Daftar Precosting yang sudah diproses (status: confirm & reject)'
      : `Daftar Precosting dengan filter status: ${effectiveStatus}`;

    res.json({
      success: true,
      status: '1',
      description: desc,
      filter: {
        status: rawStatus ?? '',
        effectiveStatus,
      },
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: '0',
      error_list: error.message,
      message: error.message,
    });
  }
};

// Route status Precosting (Mendukung GET dan POST untuk integrasi C# .NET)
router.get('/confirm-reject', handleQueryPrecostingsByStatus);
router.post('/confirm-reject', handleQueryPrecostingsByStatus);

router.get('/confirm-or-reject', handleQueryPrecostingsByStatus);
router.post('/confirm-or-reject', handleQueryPrecostingsByStatus);

router.get('/processed', handleQueryPrecostingsByStatus);
router.post('/processed', handleQueryPrecostingsByStatus);

router.get('/reviewed', handleQueryPrecostingsByStatus);
router.post('/reviewed', handleQueryPrecostingsByStatus);

router.get('/query', handleQueryPrecostingsByStatus);
router.post('/query', handleQueryPrecostingsByStatus);

router.get('/list', handleQueryPrecostingsByStatus);
router.post('/list', handleQueryPrecostingsByStatus);

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

// Standar Baku Field yang Diizinkan untuk Precosting Payload
const ALLOWED_PRECOSTING_FIELDS = new Set([
  // Standar Baku PascalCase (Sesuai Kolom Tabel PostgreSQL PrecostingHeader)
  'PrecostingNo',
  'ProdName',
  'ProdQty',
  'Consume',
  'FabricPrice',
  'TotalFabricPrice',
  'CMTPrice',
  'AccPrice',
  'HPP',
  'TaxPrice',
  'ProductImage',
  'ProdImage_base64',
  'Buyer',
  'Category',
  'DeliveryDate',
  'Status',
  'Fabrics',
  'Accessories',
  'Services',
  'Remarks',

  // Standar camelCase & snake_case
  'precostingNo',
  'precosting_no',
  'itemName',
  'item_name',
  'prodName',
  'prod_name',
  'itemCode',
  'item_code',
  'targetQty',
  'target_qty',
  'prodQty',
  'prod_qty',
  'season',
  'unit',
  'consm',
  'consume',
  'fabricPrice',
  'fabric_price',
  'totalFabric',
  'total_fabric',
  'totalFabricPrice',
  'total_fabric_price',
  'cmtPrice',
  'cmt_price',
  'accPrice',
  'acc_price',
  'hpp',
  'taxPrice',
  'tax_price',
  'image',
  'productImage',
  'product_image',
  'prodImage_base64',
  'prod_image_base64',
  'ProdImage',
  'prodImage',
  'prod_image',
  'buyer',
  'category',
  'deliveryDate',
  'delivery_date',
  'Delivery_Date',
  'deliveryDateStr',
  'status',
  'approvedBy',
  'approved_by',
  'approvalDate',
  'approval_date',
  'approvalNotes',
  'approval_notes',
  'fabrics',
  'accessories',
  'services',
  'remarks',
  'id',
  'action',
  'search',
  'Search',
  'sortBy',
  'SortBy',
]);

function validatePrecostingPayload(raw, isCreate = true) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, message: 'Request body harus berupa JSON object.' };
  }

  // 1. Cek jika ada nama field yang salah / tidak dikenali (Fixed Strict Schema)
  const unknownFields = Object.keys(raw).filter((k) => !ALLOWED_PRECOSTING_FIELDS.has(k));
  if (unknownFields.length > 0) {
    return {
      valid: false,
      message: `Nama field tidak valid: [${unknownFields.join(', ')}]. Harap gunakan nama field baku sesuai dokumentasi server/README.md.`,
      invalidFields: unknownFields,
      standardFields: [
        'PrecostingNo', 'ProdName', 'ProdQty', 'Consume', 'FabricPrice',
        'CMTPrice', 'AccPrice', 'ProductImage', 'ProdImage_base64', 'Buyer', 'Category',
        'DeliveryDate', 'Status', 'Fabrics', 'Accessories', 'Services', 'Remarks'
      ],
    };
  }

  // 2. Cek field wajib saat insert/upsert
  if (isCreate) {
    const precostingNo = raw.PrecostingNo ?? raw.precostingNo;
    const prodName = raw.ProdName ?? raw.itemName;

    if (!precostingNo || typeof precostingNo !== 'string' || !precostingNo.trim()) {
      return {
        valid: false,
        message: "Field wajib 'PrecostingNo' (string) tidak boleh kosong. Contoh: 'CBD-2610-00005' atau 'PC-2026-001'.",
      };
    }

    if (!prodName || typeof prodName !== 'string' || !prodName.trim()) {
      return {
        valid: false,
        message: "Field wajib 'ProdName' (string) tidak boleh kosong. Contoh: 'Kemeja Katun Kotak'.",
      };
    }
  }

  function parseNumeric(val) {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/,/g, '').trim();
      if (cleaned === '') return null;
      const num = Number(cleaned);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  // 3. Validasi tipe data numerik
  const numericCheckList = [
    { key: 'ProdQty', alt: 'targetQty' },
    { key: 'Consume', alt: 'consm' },
    { key: 'FabricPrice', alt: 'fabricPrice' },
    { key: 'TotalFabricPrice', alt: 'totalFabric' },
    { key: 'CMTPrice', alt: 'cmtPrice' },
    { key: 'AccPrice', alt: 'accPrice' },
    { key: 'HPP', alt: 'hpp' },
    { key: 'TaxPrice', alt: 'taxPrice' },
  ];

  for (const { key, alt } of numericCheckList) {
    const activeKey = raw[key] !== undefined ? key : (raw[alt] !== undefined ? alt : null);
    if (activeKey !== null) {
      const val = raw[activeKey];
      if (val !== null && val !== undefined && val !== '' && parseNumeric(val) === null) {
        return {
          valid: false,
          message: `Nilai field '${activeKey}' harus berupa angka (number), diterima: ${JSON.stringify(val)}.`,
        };
      }
    }
  }

  return { valid: true };
}

// POST /api/precostings - Create / True UPSERT precosting ATAU Query Status jika payload berupa query
router.post('/', async (req, res) => {
  try {
    const raw = req.body || {};

    const hasPrecostingNo = Boolean(
      (raw.PrecostingNo && String(raw.PrecostingNo).trim()) ||
      (raw.precostingNo && String(raw.precostingNo).trim()) ||
      (raw.precosting_no && String(raw.precosting_no).trim())
    );
    const hasProdName = Boolean(
      (raw.ProdName && String(raw.ProdName).trim()) ||
      (raw.itemName && String(raw.itemName).trim()) ||
      (raw.prodName && String(raw.prodName).trim())
    );

    // Jika request POST tidak memiliki PrecostingNo dan ProdName,
    // tetapi mengirim parameter status (misal { "status": "" } atau { "status": "reject" }),
    // maka tangani sebagai query data agar pemanggil dari aplikasi utama C# tetap lancar menggunakan POST ke root endpoint
    const isStatusQuery =
      (raw.status !== undefined || raw.Status !== undefined) &&
      (!hasPrecostingNo && !hasProdName);

    if (isStatusQuery || raw.action === 'query' || raw.action === 'list') {
      return handleQueryPrecostingsByStatus(req, res);
    }

    const validation = validatePrecostingPayload(raw, true);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        status: '0',
        error_list: validation.message,
        message: validation.message,
        invalidFields: validation.invalidFields,
        standardFields: validation.standardFields,
      });
    }

    const created = await precostingStore.create(raw);
    res.status(201).json({
      success: true,
      status: '1',
      error_list: '',
      message: `Precosting ${created.precostingNo} berhasil disimpan ke database`,
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: '0',
      error_list: error.message,
      message: error.message,
    });
  }
});

// Dedicated Image Update Handler (Supports both URL param /:id/image and body PrecostingNo)
async function handleUpdateImage(req, res) {
  try {
    const raw = req.body || {};
    const precostingNo =
      req.params.id ||
      raw.PrecostingNo ||
      raw.precostingNo ||
      raw.precosting_no ||
      raw.id;

    if (!precostingNo || typeof precostingNo !== 'string' || !precostingNo.trim()) {
      return res.status(400).json({
        success: false,
        status: '0',
        message: "Nomor Precosting ('PrecostingNo') wajib disertakan pada URL atau di dalam JSON body request.",
      });
    }

    const imageVal =
      raw.ProdImage_base64 ??
      raw.prodImage_base64 ??
      raw.ProductImage ??
      raw.productImage ??
      raw.product_image ??
      raw.image ??
      raw.imageBase64 ??
      raw.image_base64 ??
      null;

    if (!imageVal || typeof imageVal !== 'string' || !imageVal.trim()) {
      return res.status(400).json({
        success: false,
        status: '0',
        message: "Field gambar Base64 ('ProdImage_base64' atau 'ProductImage') wajib disertakan dan berupa string Base64 yang valid.",
      });
    }

    const updated = await precostingStore.updateImage(precostingNo.trim(), imageVal.trim());
    if (!updated) {
      return res.status(404).json({
        success: false,
        status: '0',
        message: `Precosting dengan nomor '${precostingNo}' tidak ditemukan di database.`,
      });
    }

    res.json({
      success: true,
      status: '1',
      message: `Gambar Base64 untuk Precosting ${updated.precostingNo} berhasil diperbarui.`,
      data: {
        id: updated.id,
        precostingNo: updated.precostingNo,
        prodName: updated.itemName,
        hasImage: Boolean(updated.image),
        imageLength: updated.image ? updated.image.length : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: '0',
      error_list: error.message,
      message: error.message,
    });
  }
}

// POST & PUT /api/precostings/update-image (PrecostingNo in body)
router.post('/update-image', handleUpdateImage);
router.put('/update-image', handleUpdateImage);

// POST & PUT /api/precostings/:id/image (PrecostingNo in URL path)
router.post('/:id/image', handleUpdateImage);
router.put('/:id/image', handleUpdateImage);

// PUT /api/precostings/:id - Update precosting
router.put('/:id', async (req, res) => {
  try {
    const raw = req.body || {};

    const validation = validatePrecostingPayload(raw, false);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        invalidFields: validation.invalidFields,
        standardFields: validation.standardFields,
      });
    }

    const updated = await precostingStore.update(req.params.id, raw);
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
      message: `Precosting ${updated.precostingNo} berhasil dikonfirmasi (confirmed)`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/precostings/:id/reject - Reject Precosting
router.post('/:id/reject', async (req, res) => {
  try {
    const { reviewerName, notes } = req.body;
    if (!notes || !notes.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Catatan / remarks alasan penolakan wajib diisi untuk melakukan reject.' 
      });
    }

    const updated = await precostingStore.reject(req.params.id, {
      reviewerName: reviewerName || 'Authorized Reviewer',
      notes: notes.trim(),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Precosting tidak ditemukan' });
    }

    res.json({
      success: true,
      message: `Status Precosting ${updated.precostingNo} berhasil diubah menjadi reject`,
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
