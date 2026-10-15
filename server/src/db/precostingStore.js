import { query, getDbStatus } from './connection.js';
import { defaultPrecostings, defaultUsers } from './seedData.js';
import { calculatePrecostingTotals } from '../utils/calculations.js';

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
    hargaFabric: fabricPrice,
    totalKain: totalFabric,
    hargaCmt: cmtPrice,
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
export function normalizePrecostingInput(payload = {}) {
  if (!payload || typeof payload !== 'object') return {};

  const precostingNo =
    payload.PrecostingNo ||
    payload.precostingNo ||
    payload.precosting_no ||
    payload.id ||
    '';

  const itemName =
    payload.ProdName ||
    payload.prodName ||
    payload.prod_name ||
    payload.itemName ||
    payload.item_name ||
    payload.ItemName ||
    'Style Garment';

  const image =
    payload.ProductImage ||
    payload.productImage ||
    payload.product_image ||
    payload.image ||
    '';

  const targetQty = Number(
    payload.ProdQty ??
    payload.prodQty ??
    payload.prod_qty ??
    payload.targetQty ??
    payload.target_qty ??
    payload.qty ??
    1000
  );

  const consm = Number(
    payload.Consume ??
    payload.consume ??
    payload.consm ??
    payload.mainFabricConsumption ??
    0
  );

  const fabricPrice = Number(
    payload.FabricPrice ??
    payload.fabricPrice ??
    payload.fabric_price ??
    payload.hargaFabric ??
    payload.harga_fabric ??
    payload.mainFabricUnitPrice ??
    0
  );

  const totalFabric = Number(
    payload.TotalFabricPrice ??
    payload.totalFabricPrice ??
    payload.total_fabric_price ??
    payload.totalKain ??
    payload.total_kain ??
    (consm * fabricPrice)
  );

  const cmtPrice = Number(
    payload.CMTPrice ??
    payload.cmtPrice ??
    payload.cmt_price ??
    payload.hargaCmt ??
    payload.harga_cmt ??
    payload.jasaCostPerPcs ??
    0
  );

  const accPrice = Number(
    payload.AccPrice ??
    payload.accPrice ??
    payload.acc_price ??
    payload.hargaAccessories ??
    payload.harga_accessories ??
    payload.accCostPerPcs ??
    0
  );

  const baseCost = totalFabric + cmtPrice + accPrice;
  const hpp = payload.HPP !== undefined
    ? Number(payload.HPP)
    : payload.hpp !== undefined
    ? Number(payload.hpp)
    : (baseCost > 0 ? Math.round(baseCost * 1.025) : 0);

  const taxPrice = payload.TaxPrice !== undefined
    ? Number(payload.TaxPrice)
    : payload.taxPrice !== undefined
    ? Number(payload.taxPrice)
    : payload.ppn !== undefined
    ? Number(payload.ppn)
    : Math.round(hpp * 0.11);

  const status =
    payload.Status ||
    payload.status ||
    'Pending Approval';

  const buyer = payload.Buyer || payload.buyer || 'Global Buyer';
  const category = payload.Category || payload.category || 'Garment';
  const deliveryDate = payload.DeliveryDate || payload.deliveryDate || payload.delivery_date || '';

  const approvedBy = payload.ApprovedBy || payload.approvedBy || null;
  const approvalDate = payload.ApprovalDate || payload.approvalDate || null;
  const approvalNotes = payload.ApprovalNotes || payload.approvalNotes || '';

  const parseJson = (val, fallback = null) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  };

  const rawFabrics = parseJson(payload.Fabrics || payload.fabrics, null);
  const fabrics = rawFabrics || (fabricPrice > 0 || consm > 0 ? [
    {
      id: `f-${Date.now()}-1`,
      name: payload.FabricName || payload.fabricName || 'Main Fabric',
      spec: payload.FabricSpec || payload.fabricSpec || 'Garment Specification',
      part: 'Body',
      consumption: consm,
      unit: payload.FabricUnit || payload.fabricUnit || 'Meter',
      unitPrice: fabricPrice,
    },
  ] : []);

  const rawAcc = parseJson(payload.Accessories || payload.accessories, null);
  const accessories = rawAcc || (accPrice > 0 ? [
    {
      id: `a-${Date.now()}-1`,
      name: 'Trims & Accessories Package',
      spec: 'Complete package per pcs',
      qtyPerPcs: 1,
      unit: 'Set',
      unitPrice: accPrice,
    },
  ] : []);

  const rawServices = parseJson(payload.Services || payload.services, null);
  const services = rawServices || (cmtPrice > 0 ? [
    {
      id: `s-${Date.now()}-1`,
      name: 'CMT Service (Cutting, Making, Trimming)',
      category: 'Direct CMT',
      description: 'Total jasa CMT per pcs',
      unitPrice: cmtPrice,
    },
  ] : []);

  const remarks = parseJson(payload.Remarks || payload.remarks, []);

  return {
    precostingNo,
    itemName,
    targetQty,
    image,
    consm,
    fabricPrice,
    totalFabric,
    cmtPrice,
    accPrice,
    hpp,
    taxPrice,
    status,
    buyer,
    category,
    deliveryDate,
    approvedBy,
    approvalDate,
    approvalNotes,
    fabrics,
    accessories,
    services,
    remarks,
  };
}

export const precostingStore = {
  // 1. Get all from PrecostingHeader with search, status filter, and sorting
  async getAll({ search = '', status = 'ALL', sortBy = 'date-desc' } = {}) {
    const dbStatus = getDbStatus();

    let items = [];
    if (dbStatus.isConnected) {
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
        console.error('Error querying PrecostingHeader from PostgreSQL, fallback to memory:', err.message);
        items = memoryPrecostings;
      }
    } else {
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
    const dbStatus = getDbStatus();
    if (dbStatus.isConnected) {
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
        console.error('Error fetching single header:', err.message);
      }
    }

    const all = await this.getAll();
    return all.find((item) => String(item.id) === String(id) || item.precostingNo === id) || null;
  },

  // 3. Create precosting into PrecostingHeader
  async create(rawData) {
    const data = normalizePrecostingInput(rawData);

    const calculated = calculatePrecostingTotals({
      ...data,
      createdDate: data.createdDate || new Date().toISOString().split('T')[0],
      status: data.status || 'Pending Approval',
      fabrics: data.fabrics || [],
      accessories: data.accessories || [],
      services: data.services || [],
      remarks: data.remarks && data.remarks.length > 0 ? data.remarks : [
        {
          id: `rem-${Date.now()}`,
          author: 'System API',
          role: 'External System',
          timestamp: new Date().toLocaleString('id-ID'),
          text: `Precosting ${data.precostingNo} berhasil diterima dari integrasi sistem eksternal.`,
        },
      ],
    });

    const dbStatus = getDbStatus();
    if (dbStatus.isConnected) {
      try {
        // Cek apakah data dengan PrecostingNo ini sudah ada (upsert support)
        const checkExist = await query(
          'SELECT id FROM "PrecostingHeader" WHERE "PrecostingNo" = $1 LIMIT 1',
          [calculated.precostingNo]
        );

        if (checkExist.rows && checkExist.rows.length > 0) {
          const existingId = checkExist.rows[0].id;
          const updateSql = `
            UPDATE "PrecostingHeader" SET
              "ProductImage" = $1, "ProdQty" = $2, "ProdName" = $3, "Consume" = $4,
              "FabricPrice" = $5, "TotalFabricPrice" = $6, "CMTPrice" = $7, "AccPrice" = $8,
              "HPP" = $9, "TaxPrice" = $10, "Status" = $11, "Buyer" = $12, "Category" = $13,
              "DeliveryDate" = $14, "Fabrics" = $15, "Accessories" = $16, "Services" = $17, "Remarks" = $18
            WHERE id = $19
            RETURNING id
          `;
          await query(updateSql, [
            calculated.image || '',
            calculated.targetQty || 1000,
            calculated.itemName || 'New Style',
            calculated.mainFabricConsumption || 0,
            calculated.mainFabricUnitPrice || 0,
            calculated.fabricCostPerPcs || 0,
            calculated.jasaCostPerPcs || 0,
            calculated.accCostPerPcs || 0,
            calculated.hppPerPcs || 0,
            calculated.ppnPerPcs || 0,
            calculated.status || 'Pending Approval',
            calculated.buyer || '',
            calculated.category || '',
            calculated.deliveryDate || '',
            JSON.stringify(calculated.fabrics || []),
            JSON.stringify(calculated.accessories || []),
            JSON.stringify(calculated.services || []),
            JSON.stringify(calculated.remarks || []),
            existingId,
          ]);
          calculated.id = String(existingId);
        } else {
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
            calculated.image || '',
            calculated.targetQty || 1000,
            calculated.itemName || 'New Style',
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
        }
      } catch (err) {
        console.error('Error saving into PrecostingHeader table:', err.message);
      }
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

  // 4. Update PrecostingHeader
  async update(id, rawData) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const data = normalizePrecostingInput(rawData);
    const updated = calculatePrecostingTotals({
      ...existing,
      ...data,
      id: existing.id,
    });

    const dbStatus = getDbStatus();
    if (dbStatus.isConnected) {
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
            "DeliveryDate" = $20
          WHERE id::text = $21 OR "PrecostingNo" = $21
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
          String(id),
        ]);
      } catch (err) {
        console.error('Error updating PrecostingHeader in PostgreSQL:', err.message);
      }
    }

    const index = memoryPrecostings.findIndex((p) => String(p.id) === String(id) || p.precostingNo === id);
    if (index !== -1) {
      memoryPrecostings[index] = updated;
    }
    return updated;
  },

  // 5. Delete from PrecostingHeader
  async delete(id) {
    const dbStatus = getDbStatus();
    if (dbStatus.isConnected) {
      try {
        await query('DELETE FROM "PrecostingHeader" WHERE id::text = $1 OR "PrecostingNo" = $1', [String(id)]);
      } catch (err) {
        console.error('Error deleting from PrecostingHeader:', err.message);
      }
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

  // 9. POPULATE PrecostingHeader (API helper to seed / populate data)
  async populateHeader(customItems = null) {
    const sourceData = Array.isArray(customItems) && customItems.length > 0 ? customItems : defaultPrecostings;
    const populated = sourceData.map(calculatePrecostingTotals);

    const dbStatus = getDbStatus();
    if (dbStatus.isConnected) {
      try {
        for (const p of populated) {
          await query(
            `INSERT INTO "PrecostingHeader" (
              "ProductImage", "ProdQty", "ProdName", "Consume", "FabricPrice", 
              "TotalFabricPrice", "CMTPrice", "AccPrice", "HPP", "TaxPrice", "Status",
              "PrecostingNo", "Buyer", "Category", "DeliveryDate", "ApprovedBy", 
              "ApprovalDate", "ApprovalNotes", "Fabrics", "Accessories", "Services", "Remarks"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
            [
              p.image || '',
              p.targetQty || 1000,
              p.itemName || 'Sample Style',
              p.mainFabricConsumption || 0,
              p.mainFabricUnitPrice || 0,
              p.fabricCostPerPcs || 0,
              p.jasaCostPerPcs || 0,
              p.accCostPerPcs || 0,
              p.hppPerPcs || 0,
              p.ppnPerPcs || 0,
              p.status || 'Pending Approval',
              p.precostingNo,
              p.buyer || '',
              p.category || '',
              p.deliveryDate || '',
              p.approvedBy || null,
              p.approvalDate || null,
              p.approvalNotes || '',
              JSON.stringify(p.fabrics || []),
              JSON.stringify(p.accessories || []),
              JSON.stringify(p.services || []),
              JSON.stringify(p.remarks || []),
            ]
          );
        }
      } catch (err) {
        console.error('Error in populateHeader SQL execution:', err.message);
      }
    }

    memoryPrecostings = populated;
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

