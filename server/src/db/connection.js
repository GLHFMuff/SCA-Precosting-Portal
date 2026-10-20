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

export const syncDatabaseUsers = async (clientOrPool = pgPool) => {
  try {
    // 1. Ensure table Users exists
    await clientOrPool.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(50),
        avatar VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Remove legacy dummy users so only the 2 requested users exist
    await clientOrPool.query(`
      DELETE FROM "Users" 
      WHERE LOWER(TRIM(username)) NOT IN ('developer', 'management')
    `);

    // 3. Upsert User 1: Developer
    await clientOrPool.query(`
      INSERT INTO "Users" (id, username, password, name, role, department, avatar)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO UPDATE 
      SET password = EXCLUDED.password,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          avatar = EXCLUDED.avatar
    `, [
      'usr-dev',
      'developer',
      'dev123',
      'Lead Developer',
      'Lead Developer',
      'IT & System Development',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    ]);

    // 4. Upsert User 2: Management
    await clientOrPool.query(`
      INSERT INTO "Users" (id, username, password, name, role, department, avatar)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO UPDATE 
      SET password = EXCLUDED.password,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          avatar = EXCLUDED.avatar
    `, [
      'usr-mgmt',
      'management',
      '.dma01',
      'Management',
      'Management',
      'Management',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    ]);

    console.log('✅ [Database] Akun Users tersimpan di PostgreSQL (2 User: Developer & Management)!');
    return true;
  } catch (error) {
    console.warn(`⚠️  [Database] Gagal mensinkronkan tabel Users: ${error.message}`);
    return false;
  }
};

// Test connection on boot
export const testConnection = async () => {
  try {
    if (pgPool) {
      const client = await pgPool.connect();
      await client.query('SELECT NOW()');
      await client.query('ALTER TABLE IF EXISTS "PrecostingHeader" ADD COLUMN IF NOT EXISTS "ApprovedDate" VARCHAR(50)');
      await client.query('ALTER TABLE IF EXISTS "PrecostingHeader" ADD COLUMN IF NOT EXISTS "ProdImage_base64" TEXT');
      await client.query('ALTER TABLE IF EXISTS "PrecostingHeader" ADD COLUMN IF NOT EXISTS "ProductImage" TEXT');
      await client.query('ALTER TABLE IF EXISTS "PrecostingHeader" ADD COLUMN IF NOT EXISTS "sync_status" VARCHAR(50) DEFAULT \'pending\'');
      await client.query('UPDATE "PrecostingHeader" SET "sync_status" = \'pending\' WHERE "sync_status" IS NULL');
      await client.query("UPDATE \"PrecostingHeader\" SET \"Status\" = 'Rejected' WHERE LOWER(\"Status\") IN ('reject', 'rejected', 'revision')");
      await client.query("UPDATE \"PrecostingHeader\" SET \"Status\" = 'Confirmed' WHERE LOWER(\"Status\") IN ('confirmed', 'confirm', 'approved')");
      await client.query("UPDATE \"PrecostingHeader\" SET \"Status\" = 'Pending' WHERE LOWER(\"Status\") NOT IN ('confirmed', 'rejected') OR \"Status\" IS NULL OR TRIM(\"Status\") = ''");
      await client.query('ALTER TABLE IF EXISTS "PrecostingHeader" ALTER COLUMN "Status" SET DEFAULT \'Pending\'');
      
      // Ensure Users table exists and only the 2 requested users are present
      await syncDatabaseUsers(client);

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
testConnection().catch(() => { });

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
