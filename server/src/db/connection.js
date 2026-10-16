import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.resolve(__dirname, '../../.env');
const cwdEnvPath = path.resolve(process.cwd(), 'server/.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(cwdEnvPath)) {
  dotenv.config({ path: cwdEnvPath });
} else {
  dotenv.config();
}

const { Pool: PgPool } = pg;

let pgPool = null;
let isConnected = false;

const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'cloth_precosting_portal',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
    };

pgPool = new PgPool(config);

// Test connection on boot
export const testConnection = async () => {
  try {
    if (pgPool) {
      const client = await pgPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      isConnected = true;
      console.log('✅ [Database] Berhasil terhubung ke PostgreSQL database!');
      return true;
    }
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️  [Database] Koneksi PostgreSQL belum siap (${error.message}).`);
    console.warn(`ℹ️  [Database] Server beralih sementara ke Integrated Memory Store agar API tetap bisa digunakan.`);
    console.warn(`ℹ️  [Database] Anda dapat mengatur password/kredensial DB di file server/.env kapan saja.`);
    return false;
  }
};

// Initiate non-blocking connection check on import
testConnection().catch(() => {});

export const getDbStatus = () => ({
  client: 'postgres',
  isConnected,
});

export const query = async (sql, params = []) => {
  if (pgPool) {
    const res = await pgPool.query(sql, params);
    isConnected = true;
    return res;
  }
  throw new Error('PostgreSQL database pool is not configured');
};

export { pgPool };
