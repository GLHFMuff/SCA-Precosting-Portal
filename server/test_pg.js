import dotenv from 'dotenv';
import pg from 'pg';
import { defaultPrecostings } from './src/db/seedData.js';
import { calculatePrecostingTotals } from './src/utils/calculations.js';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'cloth_precosting_portal',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Testing populate PrecostingHeader with sample items...');
    for (const raw of defaultPrecostings) {
      const p = calculatePrecostingTotals(raw);
      await client.query(`
        INSERT INTO "PrecostingHeader" (
          "ProductImage", "ProdQty", "ProdName", "Consume", "FabricPrice", 
          "TotalFabricPrice", "CMTPrice", "AccPrice", "HPP", "TaxPrice", "Status",
          "PrecostingNo", "Buyer", "Category", "DeliveryDate", "ApprovedBy", 
          "ApprovalDate", "ApprovalNotes", "Fabrics", "Accessories", "Services", "Remarks"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `, [
        p.image,
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
        p.precostingNo,
        p.buyer,
        p.category,
        p.deliveryDate,
        p.approvedBy,
        p.approvalDate,
        p.approvalNotes,
        JSON.stringify(p.fabrics || []),
        JSON.stringify(p.accessories || []),
        JSON.stringify(p.services || []),
        JSON.stringify(p.remarks || [])
      ]);
    }
    console.log('Populate completed successfully!');

    const res = await client.query('SELECT id, "PrecostingNo", "ProdName", "ProdQty", "HPP", "Status" FROM "PrecostingHeader"');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
