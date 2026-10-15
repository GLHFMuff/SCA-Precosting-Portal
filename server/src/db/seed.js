import { query, testConnection } from './connection.js';
import { defaultUsers, defaultPrecostings } from './seedData.js';
import { calculatePrecostingTotals } from '../utils/calculations.js';
import { ensureBase64Image } from '../utils/imageHelper.js';
import { fileURLToPath } from 'url';

export const seedDatabase = async () => {
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('ℹ️  Skipping SQL seed: database not reachable.');
    return false;
  }

  try {
    console.log('🌱 Seeding database "cloth_precosting_portal"...');

    // 1. Seed Users
    for (const u of defaultUsers) {
      await query(
        `INSERT INTO "Users" (id, username, password, name, role, department, avatar)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role`,
        [u.id, u.username, u.password, u.name, u.role, u.department, u.avatar]
      );
    }

    // 2. Seed PrecostingHeader & Details
    for (const raw of defaultPrecostings) {
      const p = calculatePrecostingTotals(raw);

      await query(
        `INSERT INTO "PrecostingHeader" 
         (id, precosting_no, image, target_qty, item_name, consm, harga_fabric, total_kain, harga_cmt, harga_accessories, hpp, ppn, status, item_code, category, season, buyer, unit, delivery_date, created_date, approved_by, approval_date, approval_notes, buffer_rate, markup_rate, ppn_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
         ON CONFLICT (id) DO UPDATE SET 
           item_name = EXCLUDED.item_name, 
           consm = EXCLUDED.consm,
           harga_fabric = EXCLUDED.harga_fabric,
           total_kain = EXCLUDED.total_kain,
           harga_cmt = EXCLUDED.harga_cmt,
           harga_accessories = EXCLUDED.harga_accessories,
           hpp = EXCLUDED.hpp,
           ppn = EXCLUDED.ppn,
           status = EXCLUDED.status,
           target_qty = EXCLUDED.target_qty`,
        [
          p.id,
          p.precostingNo,
          ensureBase64Image(p.image),
          p.targetQty,
          p.itemName,
          p.mainFabricConsumption || 0,
          p.mainFabricUnitPrice || 0,
          p.fabricCostPerPcs || 0,
          p.jasaCostPerPcs || 0,
          p.accCostPerPcs || 0,
          p.hppPerPcs || 0,
          p.ppnPerPcs || 0,
          p.status,
          p.itemCode,
          p.category,
          p.season,
          p.buyer,
          p.unit,
          p.deliveryDate,
          p.createdDate,
          p.approvedBy,
          p.approvalDate,
          p.approvalNotes,
          p.bufferRate,
          p.markupRate,
          p.ppnRate,
        ]
      );

      // Clean existing related sub-items
      await query('DELETE FROM "PrecostingFabric" WHERE precosting_id = $1', [p.id]);
      await query('DELETE FROM "PrecostingAccessory" WHERE precosting_id = $1', [p.id]);
      await query('DELETE FROM "PrecostingService" WHERE precosting_id = $1', [p.id]);
      await query('DELETE FROM "PrecostingRemark" WHERE precosting_id = $1', [p.id]);

      // Seed fabrics
      for (const f of p.fabrics || []) {
        await query(
          `INSERT INTO "PrecostingFabric" (id, precosting_id, name, spec, part, consumption, unit, unit_price, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [f.id, p.id, f.name, f.spec, f.part, f.consumption, f.unit, f.unitPrice, f.sortOrder || 0]
        );
      }

      // Seed accessories
      for (const a of p.accessories || []) {
        await query(
          `INSERT INTO "PrecostingAccessory" (id, precosting_id, name, spec, qty_per_pcs, unit, unit_price, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [a.id, p.id, a.name, a.spec, a.qtyPerPcs, a.unit, a.unitPrice, a.sortOrder || 0]
        );
      }

      // Seed services
      for (const s of p.services || []) {
        await query(
          `INSERT INTO "PrecostingService" (id, precosting_id, name, category, description, unit_price, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [s.id, p.id, s.name, s.category, s.description, s.unitPrice, s.sortOrder || 0]
        );
      }

      // Seed remarks
      for (const r of p.remarks || []) {
        await query(
          `INSERT INTO "PrecostingRemark" (id, precosting_id, author, role, timestamp, text)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [r.id, p.id, r.author, r.role, r.timestamp, r.text]
        );
      }
    }

    console.log('✅ [Database] Seed data berhasil dimasukkan ke tabel "PrecostingHeader" & relasinya!');
    return true;
  } catch (error) {
    console.error('❌ [Database] Gagal melakukan seeding:', error.message);
    return false;
  }
};

// If run directly: node src/db/seed.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
