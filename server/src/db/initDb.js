import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, testConnection, getDbStatus } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async () => {
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('ℹ️  Skipping SQL table creation: database not yet reachable.');
    return false;
  }

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    // Split SQL by semicolons
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await query(statement);
    }

    console.log('✅ [Database] Semua tabel database (users, precostings, fabrics, acc, services, remarks) berhasil disiapkan!');
    return true;
  } catch (error) {
    console.error('❌ [Database] Gagal menjalankan inisialisasi schema:', error.message);
    return false;
  }
};

// If run directly: node src/db/initDb.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
