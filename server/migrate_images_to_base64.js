import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureBase64Image } from './src/utils/imageHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  console.log('--- Migrating ProductImage in PrecostingHeader to Base64 ---');
  const res = await pool.query('SELECT id, "PrecostingNo", "ProductImage" FROM "PrecostingHeader"');
  console.log(`Found ${res.rows.length} records.`);

  let updatedCount = 0;
  for (const row of res.rows) {
    const original = row.ProductImage || '';
    let targetBase64 = '';

    if (original.startsWith('data:image/')) {
      targetBase64 = original;
    } else {
      // Map based on PrecostingNo or original filename
      let filename = path.basename(original || '');
      if (!filename || filename === '.' || filename === '/') {
        if (row.PrecostingNo?.includes('001')) filename = 'shirt.jpg';
        else if (row.PrecostingNo?.includes('002')) filename = 'blouse.jpg';
        else if (row.PrecostingNo?.includes('003')) filename = 'hoodie.jpg';
        else if (row.PrecostingNo?.includes('004')) filename = 'chino.jpg';
        else if (row.PrecostingNo?.includes('005')) filename = 'polo.jpg';
        else if (row.PrecostingNo?.includes('006')) filename = 'jacket.jpg';
        else filename = 'shirt.jpg';
      }

      targetBase64 = ensureBase64Image(filename);
    }

    if (targetBase64 && targetBase64 !== original) {
      await pool.query(
        'UPDATE "PrecostingHeader" SET "ProductImage" = $1 WHERE id = $2',
        [targetBase64, row.id]
      );
      updatedCount++;
      console.log(`Updated [ID: ${row.id}, No: ${row.PrecostingNo}] -> Base64 length: ${targetBase64.length}`);
    } else {
      console.log(`Skipped [ID: ${row.id}, No: ${row.PrecostingNo}] (Already base64 or unchanged)`);
    }
  }

  console.log(`Migration finished. ${updatedCount} records converted to Base64.`);
  await pool.end();
}

migrate().catch(console.error);
