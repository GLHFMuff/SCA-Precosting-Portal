import { query, getDbStatus } from './connection.js';
import { defaultPrecostings, defaultUsers } from './seedData.js';
import { calculatePrecostingTotals } from '../utils/calculations.js';
import { ensureBase64Image } from '../utils/imageHelper.js';

// In-Memory Fallback State (no dummy data)
let memoryPrecostings = [];
let memoryUsers = [...defaultUsers];

// Helper to map DB row from "PrecostingHeader" to frontend domain model
function mapDbRowToPrecosting(row) {
  const parseJson = (val, fallback = []) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  };

  const id = String(row.id);
  const precostingNo = row.PrecostingNo || `PC-${String(id).padStart(4, '0')}`;
  const targetQty = Number(row.ProdQty || 1000);
  const consm = Number(row.Consume || 0);
  const fabricPrice = Number(row.FabricPrice || 0);
  const totalFabric = Number(row.TotalFabricPrice || (consm * fabricPrice));
  const cmtPrice = Number(row.CMTPrice || 0);
  const accPrice = Number(row.AccPrice || 0);
  const hpp = Number(row.HPP || (totalFabric + cmtPrice + accPrice));
  const taxPrice = Number(row.TaxPrice || (hpp * 0.11));

  const rawItem = {
    id,
    precostingNo,
    image: row.ProductImage || '',
    targetQty,
    itemName: row.ProdName || 'Style Garment',
    consm,
    fabricPrice,
    hargaFabric: fabricPrice,
    totalFabric,
    totalKain: totalFabric,
    cmtPrice,
    hargaCmt: cmtPrice,
    accPrice,
    hargaAccessories: accPrice,
    hpp,
    ppn: taxPrice,
    status: row.Status || 'Pending Approval',
    buyer: row.Buyer || 'Global Buyer',
    category: row.Category || 'Garment',
    deliveryDate: row.DeliveryDate || '',
    createdDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    approvedBy: row.ApprovedBy || null,
    approvalDate: row.ApprovalDate || null,
    approvalNotes: row.ApprovalNotes || '',
    bufferRate: 0.025,
    markupRate: 0.30,
    ppnRate: 0.11,
    savedConsm: consm,
    savedHargaFabric: fabricPrice,
    savedTotalKain: totalFabric,
    savedHargaCmt: cmtPrice,
    savedHargaAccessories: accPrice,
    savedHpp: hpp,
    savedPpn: taxPrice,
    fabrics: parseJson(row.Fabrics, [
      {
        id: `f-${id}-1`,
        name: 'Main Fabric',
        spec: 'Garment Specification',
        part: 'Body',
        consumption: consm,
        unit: 'Meter',
        unitPrice: fabricPrice,
      },
    ]),
    accessories: parseJson(row.Accessories, [
      {
        id: `a-${id}-1`,
        name: 'Trims & Accessories Package',
        spec: 'Complete package per pcs',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: accPrice,
      },
    ]),
    services: parseJson(row.Services, [
      {
        id: `s-${id}-1`,
        name: 'CMT Service (Cutting, Making, Trimming)',
        category: 'Direct CMT',
        description: 'Total jasa CMT per pcs',
        unitPrice: cmtPrice,
      },
    ]),
    remarks: parseJson(row.Remarks, []),
  };

  return calculatePrecostingTotals(rawItem);
}

// Normalizer to accept PascalCase (database column format e.g. PrecostingNo, ProdName),
// camelCase (precostingNo, itemName), and snake_case (precosting_no, prod_name)
// IMPORTANT: Only return fields that were actually provided in payload so partial updates
// never overwrite or zero-out existing database values!
export function normalizePrecostingInput(payload = {}) {
  if (!payload || typeof payload !== 'object') return {};

  const result = {};

  // Precosting No
  const precostingNo =
    payload.PrecostingNo ??
    payload.precostingNo ??
    payload.precosting_no ??
    null;
  if (precostingNo !== null && precostingNo !== undefined) {
    result.precostingNo = String(precostingNo).trim();
  } else if (payload.id && typeof payload.id === 'string' && (payload.id.includes('-') || payload.id.includes('/'))) {
    result.precostingNo = payload.id.trim();
  }

  // ProdName / ItemName
  const prodName =
    payload.ProdName ??
    payload.prodName ??
    payload.prod_name ??
    payload.itemName ??
    payload.item_name ??
    payload.ItemName ??
    null;
  if (prodName !== null && prodName !== undefined && String(prodName).trim() !== '') {
    result.itemName = String(prodName).trim();
  }

  // ProductImage
  const rawImage =
    payload.ProductImage ??
    payload.productImage ??
    payload.product_image ??
    payload.image ??
    null;
  if (rawImage !== null && rawImage !== undefined) {
    result.image = ensureBase64Image(rawImage);
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

  // ProdQty / TargetQty
  const qty = parseNumeric(
    payload.ProdQty ??
    payload.prodQty ??
    payload.prod_qty ??
    payload.targetQty ??
    payload.target_qty ??
    payload.qty
  );
  if (qty !== null) {
    result.targetQty = qty;
  }

  // Consume / consm
  const consm = parseNumeric(
    payload.Consume ??
    payload.consume ??
    payload.consm ??
    payload.mainFabricConsumption
  );
  if (consm !== null) {
    result.consm = consm;
  }

  // FabricPrice
  const fabricPrice = parseNumeric(
    payload.FabricPrice ??
    payload.fabricPrice ??
    payload.fabric_price ??
    payload.hargaFabric ??
    payload.harga_fabric ??
    payload.mainFabricUnitPrice
  );
  if (fabricPrice !== null) {
    result.fabricPrice = fabricPrice;
  }

  // TotalFabricPrice
  const totalFabric = parseNumeric(
    payload.TotalFabricPrice ??
    payload.totalFabricPrice ??
    payload.totalFabric ??
    payload.total_fabric_price ??
    payload.totalKain ??
    payload.total_kain
  );
  if (totalFabric !== null) {
    result.totalFabric = totalFabric;
  }

  // CMTPrice
  const cmtPrice = parseNumeric(
    payload.CMTPrice ??
    payload.cmtPrice ??
    payload.cmt_price ??
    payload.hargaCmt ??
    payload.harga_cmt ??
    payload.jasaCostPerPcs
  );
  if (cmtPrice !== null) {
    result.cmtPrice = cmtPrice;
  }

  // AccPrice
  const accPrice = parseNumeric(
    payload.AccPrice ??
    payload.accPrice ??
    payload.acc_price ??
    payload.hargaAccessories ??
    payload.harga_accessories ??
    payload.accCostPerPcs
  );
  if (accPrice !== null) {
    result.accPrice = accPrice;
  }

  // HPP
  const hpp = parseNumeric(
    payload.HPP ??
    payload.hpp ??
    payload.hppPerPcs
  );
  if (hpp !== null) {
    result.hpp = hpp;
  }

  // TaxPrice / PPN
  const taxPrice = parseNumeric(
    payload.TaxPrice ??
    payload.taxPrice ??
    payload.ppn ??
    payload.ppnPerPcs
  );
  if (taxPrice !== null) {
    result.taxPrice = taxPrice;
  }

  // Status
  const status = payload.Status ?? payload.status ?? null;
  if (status !== null && status !== undefined && String(status).trim() !== '') {
    result.status = String(status).trim();
  }

  // Buyer
  const buyer = payload.Buyer ?? payload.buyer ?? null;
  if (buyer !== null && buyer !== undefined && String(buyer).trim() !== '') {
    result.buyer = String(buyer).trim();
  }

  // Category
  const category = payload.Category ?? payload.category ?? null;
  if (category !== null && category !== undefined && String(category).trim() !== '') {
    result.category = String(category).trim();
  }

  // DeliveryDate
  const deliveryDate = payload.DeliveryDate ?? payload.deliveryDate ?? payload.delivery_date ?? null;
  if (deliveryDate !== null && deliveryDate !== undefined) {
    result.deliveryDate = String(deliveryDate).trim();
  }

  // Approval fields
  if (payload.ApprovedBy !== undefined || payload.approvedBy !== undefined) {
    result.approvedBy = payload.ApprovedBy ?? payload.approvedBy;
  }
  if (payload.ApprovalDate !== undefined || payload.approvalDate !== undefined) {
    result.approvalDate = payload.ApprovalDate ?? payload.approvalDate;
  }
  if (payload.ApprovalNotes !== undefined || payload.approvalNotes !== undefined) {
    result.approvalNotes = payload.ApprovalNotes ?? payload.approvalNotes;
  }

  // Arrays (Fabrics, Accessories, Services, Remarks)
  const parseJson = (val) => {
    if (val === null || val === undefined) return undefined;
    if (Array.isArray(val)) return val;
    if (typeof val === 'object') return [val];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return undefined;
    }
  };

  const fabrics = parseJson(payload.Fabrics ?? payload.fabrics);
  if (fabrics !== undefined) {
    result.fabrics = fabrics.map((f) => ({
      ...f,
      consumption: parseNumeric(f.consumption) ?? f.consumption,
      unitPrice: parseNumeric(f.unitPrice) ?? f.unitPrice,
    }));
  }

  const accessories = parseJson(payload.Accessories ?? payload.accessories);
  if (accessories !== undefined) {
    result.accessories = accessories.map((a) => ({
      ...a,
      qtyPerPcs: parseNumeric(a.qtyPerPcs) ?? a.qtyPerPcs,
      unitPrice: parseNumeric(a.unitPrice) ?? a.unitPrice,
    }));
  }

  const services = parseJson(payload.Services ?? payload.services);
  if (services !== undefined) {
    result.services = services.map((s) => ({
      ...s,
      unitPrice: parseNumeric(s.unitPrice) ?? s.unitPrice,
    }));
  }

  const remarks = parseJson(payload.Remarks ?? payload.remarks);
  if (remarks !== undefined) result.remarks = remarks;

  return result;
}

export const precostingStore = {
  // 1. Get all from PrecostingHeader with search, status filter, and sorting
  async getAll({ search = '', status = 'ALL', sortBy = 'date-desc' } = {}) {
    let items = [];
    try {
      const queryText = `
        SELECT 
          id, "ProductImage", "ProdQty", "ProdName", "Consume", "FabricPrice", 
          "TotalFabricPrice", "CMTPrice", "AccPrice", "HPP", "TaxPrice", "Status",
          created_at, "PrecostingNo", "Buyer", "Category", "DeliveryDate",
          "ApprovedBy", "ApprovalDate", "ApprovalNotes", "Fabrics", "Accessories", "Services", "Remarks"
        FROM "PrecostingHeader" 
        ORDER BY id DESC
      `;
      const res = await query(queryText);
      const rows = res.rows || res;
      items = rows.map(mapDbRowToPrecosting);
    } catch (err) {
      console.warn('Querying PrecostingHeader from PostgreSQL fallback to memory:', err.message);
      items = memoryPrecostings;
    }

    // Apply filtering
    let filtered = items.filter((item) => {
      const q = (search || '').toLowerCase();
      const matchesSearch =
        !q ||
        (item.precostingNo && item.precostingNo.toLowerCase().includes(q)) ||
        (item.itemName && item.itemName.toLowerCase().includes(q)) ||
        (item.buyer && item.buyer.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      const matchesStatus = status === 'ALL' || item.status === status;
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') return (b.createdDate || '').localeCompare(a.createdDate || '');
      if (sortBy === 'qty-desc') return (Number(b.targetQty) || 0) - (Number(a.targetQty) || 0);
      if (sortBy === 'cost-desc') return (Number(b.hppPerPcs) || 0) - (Number(a.hppPerPcs) || 0);
      if (sortBy === 'name-asc') return (a.itemName || '').localeCompare(b.itemName || '');
      return 0;
    });

    return filtered;
  },

  // 2. Get single PrecostingHeader by ID
  async getById(id) {
    try {
      const queryText = `
        SELECT 
          id, "ProductImage", "ProdQty", "ProdName", "Consume", "FabricPrice", 
          "TotalFabricPrice", "CMTPrice", "AccPrice", "HPP", "TaxPrice", "Status",
          created_at, "PrecostingNo", "Buyer", "Category", "DeliveryDate",
          "ApprovedBy", "ApprovalDate", "ApprovalNotes", "Fabrics", "Accessories", "Services", "Remarks"
        FROM "PrecostingHeader" 
        WHERE id::text = $1 OR "PrecostingNo" = $1
        LIMIT 1
      `;
      const res = await query(queryText, [String(id)]);
      const rows = res.rows || res;
      if (rows && rows.length > 0) {
        return mapDbRowToPrecosting(rows[0]);
      }
    } catch (err) {
      // Fallback
    }

    const all = await this.getAll();
    return all.find((item) => String(item.id) === String(id) || item.precostingNo === id) || null;
  },

  // 3. Create precosting into PrecostingHeader (True UPSERT by PrecostingNo)
  async create(rawData) {
    const data = normalizePrecostingInput(rawData);

    // If precostingNo is not supplied or empty, auto-generate a valid unique number
    if (!data.precostingNo || !data.precostingNo.trim()) {
      data.precostingNo = `PC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    } else {
      data.precostingNo = data.precostingNo.trim();
    }

    let existingId = null;

    try {
      // Cek apakah data dengan PrecostingNo ini sudah ada (case-insensitive & trimmed)
      const checkExist = await query(
        'SELECT id FROM "PrecostingHeader" WHERE LOWER(TRIM("PrecostingNo")) = LOWER(TRIM($1)) LIMIT 1',
        [data.precostingNo]
      );
      if (checkExist.rows && checkExist.rows.length > 0) {
        existingId = checkExist.rows[0].id;
      }
    } catch (err) {
      console.warn('Error checking existing PrecostingNo:', err.message);
      const existingMem = memoryPrecostings.find(
        (m) => m.precostingNo && m.precostingNo.toLowerCase().trim() === data.precostingNo.toLowerCase().trim()
      );
      if (existingMem) existingId = existingMem.id;
    }

    // JIKA NOMOR PRECOSTING SUDAH ADA -> UPDATE SEMUA FIELD PADA RECORD TERSEBUT
    if (existingId) {
      return await this.update(existingId, data);
    }

    // JIKA NOMOR PRECOSTING BELUM ADA -> INSERT RECORD BARU
    const newItem = {
      itemName: data.itemName || 'New Garment Style',
      targetQty: data.targetQty || 1000,
      image: data.image || '',
      buyer: data.buyer || 'Global Buyer',
      category: data.category || 'Garment',
      deliveryDate: data.deliveryDate || '',
      status: data.status || 'Pending Approval',
      approvedBy: data.approvedBy || null,
      approvalDate: data.approvalDate || null,
      approvalNotes: data.approvalNotes || '',
      createdDate: new Date().toISOString().split('T')[0],
      fabrics: data.fabrics || [],
      accessories: data.accessories || [],
      services: data.services || [],
      remarks: data.remarks && data.remarks.length > 0 ? data.remarks : [
        {
          id: `rem-${Date.now()}`,
          author: 'System API',
          role: 'External System',
          timestamp: new Date().toLocaleString('id-ID'),
          text: `Precosting ${data.precostingNo} berhasil ditambahkan ke database.`,
        },
      ],
      ...data,
    };

    const calculated = calculatePrecostingTotals(newItem);

    try {
      const insertSql = `
        INSERT INTO "PrecostingHeader" (
          "ProductImage", "ProdQty", "ProdName", "Consume", "FabricPrice", 
          "TotalFabricPrice", "CMTPrice", "AccPrice", "HPP", "TaxPrice", "Status",
          "PrecostingNo", "Buyer", "Category", "DeliveryDate", "ApprovedBy", 
          "ApprovalDate", "ApprovalNotes", "Fabrics", "Accessories", "Services", "Remarks"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING id
      `;
      const res = await query(insertSql, [
        calculated.image ? ensureBase64Image(calculated.image) : '',
        calculated.targetQty || 1000,
        calculated.itemName || 'New Garment Style',
        calculated.mainFabricConsumption || 0,
        calculated.mainFabricUnitPrice || 0,
        calculated.fabricCostPerPcs || 0,
        calculated.jasaCostPerPcs || 0,
        calculated.accCostPerPcs || 0,
        calculated.hppPerPcs || 0,
        calculated.ppnPerPcs || 0,
        calculated.status || 'Pending Approval',
        calculated.precostingNo,
        calculated.buyer || '',
        calculated.category || '',
        calculated.deliveryDate || '',
        calculated.approvedBy || null,
        calculated.approvalDate || null,
        calculated.approvalNotes || '',
        JSON.stringify(calculated.fabrics || []),
        JSON.stringify(calculated.accessories || []),
        JSON.stringify(calculated.services || []),
        JSON.stringify(calculated.remarks || []),
      ]);

      if (res.rows && res.rows[0]) {
        calculated.id = String(res.rows[0].id);
      }
    } catch (err) {
      console.warn('Error saving into PrecostingHeader table (fallback to memory):', err.message);
    }

    if (!calculated.id) {
      calculated.id = `mem-${Date.now()}`;
    }

    const existingMemIdx = memoryPrecostings.findIndex(
      (m) => m.precostingNo === calculated.precostingNo || String(m.id) === String(calculated.id)
    );
    if (existingMemIdx >= 0) {
      memoryPrecostings[existingMemIdx] = calculated;
    } else {
      memoryPrecostings.unshift(calculated);
    }
    return calculated;
  },

  // 4. Update PrecostingHeader (Safe Merge, never resets unprovided fields)
  async update(id, rawData) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const data = normalizePrecostingInput(rawData);

    // Merge only provided fields over existing fields
    const merged = {
      ...existing,
      ...data,
      id: existing.id,
      precostingNo: data.precostingNo || existing.precostingNo,
    };

    // If direct cost fields were provided or updated, keep them aligned
    if (data.consm !== undefined || data.fabricPrice !== undefined || data.totalFabric !== undefined) {
      const consm = data.consm !== undefined ? data.consm : existing.mainFabricConsumption;
      const fabricPrice = data.fabricPrice !== undefined ? data.fabricPrice : existing.mainFabricUnitPrice;
      merged.consm = consm;
      merged.fabricPrice = fabricPrice;
      merged.totalFabric = data.totalFabric !== undefined ? data.totalFabric : (consm * fabricPrice);
    }

    const updated = calculatePrecostingTotals(merged);

    try {
      const updateSql = `
        UPDATE "PrecostingHeader" SET
          "Status" = $1,
          "ApprovedBy" = $2,
          "ApprovalDate" = $3,
          "ApprovalNotes" = $4,
          "Consume" = $5,
          "FabricPrice" = $6,
          "TotalFabricPrice" = $7,
          "CMTPrice" = $8,
          "AccPrice" = $9,
          "HPP" = $10,
          "TaxPrice" = $11,
          "Remarks" = $12,
          "Fabrics" = $13,
          "Accessories" = $14,
          "Services" = $15,
          "ProdName" = $16,
          "ProdQty" = $17,
          "Buyer" = $18,
          "Category" = $19,
          "DeliveryDate" = $20,
          "ProductImage" = COALESCE($21, "ProductImage"),
          "PrecostingNo" = COALESCE($22, "PrecostingNo")
        WHERE id::text = $23 OR "PrecostingNo" = $23
      `;
      await query(updateSql, [
        updated.status,
        updated.approvedBy,
        updated.approvalDate,
        updated.approvalNotes,
        updated.mainFabricConsumption || 0,
        updated.mainFabricUnitPrice || 0,
        updated.fabricCostPerPcs || 0,
        updated.jasaCostPerPcs || 0,
        updated.accCostPerPcs || 0,
        updated.hppPerPcs || 0,
        updated.ppnPerPcs || 0,
        JSON.stringify(updated.remarks || []),
        JSON.stringify(updated.fabrics || []),
        JSON.stringify(updated.accessories || []),
        JSON.stringify(updated.services || []),
        updated.itemName,
        updated.targetQty,
        updated.buyer || '',
        updated.category || '',
        updated.deliveryDate || '',
        updated.image ? ensureBase64Image(updated.image) : null,
        updated.precostingNo || null,
        String(existing.id),
      ]);
    } catch (err) {
      console.error('Error updating PrecostingHeader in PostgreSQL:', err.message);
    }

    const index = memoryPrecostings.findIndex((p) => String(p.id) === String(existing.id) || p.precostingNo === existing.precostingNo);
    if (index !== -1) {
      memoryPrecostings[index] = updated;
    }
    return updated;
  },

  // 5. Delete from PrecostingHeader
  async delete(id) {
    try {
      await query('DELETE FROM "PrecostingHeader" WHERE id::text = $1 OR "PrecostingNo" = $1', [String(id)]);
    } catch (err) {
      console.error('Error deleting from PrecostingHeader:', err.message);
    }

    const index = memoryPrecostings.findIndex((p) => String(p.id) === String(id) || p.precostingNo === id);
    if (index === -1) return false;
    memoryPrecostings.splice(index, 1);
    return true;
  },

  // 6. Approve precosting
  async approve(id, { approverName = 'Authorized Manager', notes = '' } = {}) {
    const item = await this.getById(id);
    if (!item) return null;

    const timestamp = new Date().toLocaleString('id-ID');
    const remarks = [...(item.remarks || [])];

    if (notes && notes.trim()) {
      remarks.unshift({
        id: `rem-appr-${Date.now()}`,
        author: approverName,
        role: 'Approver',
        timestamp,
        text: `[APPROVAL NOTES]: ${notes.trim()}`,
      });
    }

    return await this.update(id, {
      status: 'Approved',
      approvedBy: approverName,
      approvalDate: timestamp,
      approvalNotes: notes || 'Approved via Precosting Portal',
      remarks,
    });
  },

  // 7. Reject / Request Revision
  async reject(id, { reviewerName = 'Reviewer', notes = '' } = {}) {
    const item = await this.getById(id);
    if (!item) return null;

    const timestamp = new Date().toLocaleString('id-ID');
    const remarks = [...(item.remarks || [])];

    if (notes && notes.trim()) {
      remarks.unshift({
        id: `rem-rev-${Date.now()}`,
        author: reviewerName,
        role: 'Reviewer',
        timestamp,
        text: `[PERMINTAAN REVISI]: ${notes.trim()}`,
      });
    }

    return await this.update(id, {
      status: 'Revision',
      approvalNotes: notes || 'Memerlukan revisi data costing',
      remarks,
    });
  },

  // 8. Add remark
  async addRemark(id, { author = 'System User', role = 'Merchandiser', text = '' } = {}) {
    const item = await this.getById(id);
    if (!item) return null;

    const newRemark = {
      id: `rem-${Date.now()}`,
      author,
      role,
      timestamp: new Date().toLocaleString('id-ID'),
      text: text.trim(),
    };

    const remarks = [newRemark, ...(item.remarks || [])];
    return await this.update(id, { remarks });
  },

  // 9. POPULATE PrecostingHeader (API helper to seed / populate data with true UPSERT)
  async populateHeader(customItems = null) {
    const sourceData = Array.isArray(customItems) && customItems.length > 0 ? customItems : defaultPrecostings;
    const populated = [];
    for (const item of sourceData) {
      const saved = await this.create(item);
      populated.push(saved);
    }
    return populated;
  },

  // 10. Dashboard Stats
  async getStats() {
    const items = await this.getAll();
    const totalCount = items.length;
    const pendingCount = items.filter((p) => p.status === 'Pending Approval').length;
    const approvedCount = items.filter((p) => p.status === 'Approved').length;
    const revisionCount = items.filter((p) => p.status === 'Revision').length;
    const draftCount = items.filter((p) => p.status === 'Draft').length;

    const totalTargetQty = items.reduce((sum, p) => sum + (Number(p.targetQty) || 0), 0);
    const totalProductionValue = items.reduce((sum, p) => sum + (Number(p.hppAllQty) || 0), 0);

    return {
      totalCount,
      pendingCount,
      approvedCount,
      revisionCount,
      draftCount,
      totalTargetQty,
      totalProductionValue,
    };
  },

  // 11. Users
  getUsers() {
    return memoryUsers;
  },

  findUserByUsername(username) {
    return memoryUsers.find((u) => u.username.toLowerCase() === (username || '').toLowerCase());
  },
};

