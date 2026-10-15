-- PostgreSQL Schema for Cloth Precosting Portal
-- Database: cloth_precosting_portal

-- 1. Main Header Table for Dashboard Grid: "PrecostingHeader"
CREATE TABLE IF NOT EXISTS "PrecostingHeader" (
  id VARCHAR(50) PRIMARY KEY,
  precosting_no VARCHAR(50) UNIQUE NOT NULL,      -- 1. Nomor Precosting
  image VARCHAR(255),                              -- 2. Image
  target_qty INT NOT NULL DEFAULT 1000,            -- 3. Qty Produksi (Pcs)
  item_name VARCHAR(255) NOT NULL,                 -- 4. Nama Style
  consm NUMERIC(10,3) DEFAULT 0,                   -- 5. Consm (Kebutuhan kain per pcs)
  harga_fabric NUMERIC(14,2) DEFAULT 0,            -- 6. Harga Fabric (per meter/kg)
  total_kain NUMERIC(14,2) DEFAULT 0,              -- 7. Total Kain (Harga Fabric * Consm)
  harga_cmt NUMERIC(14,2) DEFAULT 0,               -- 8. Harga CMT (Total Jasa)
  harga_accessories NUMERIC(14,2) DEFAULT 0,       -- 9. Harga Accessories
  hpp NUMERIC(14,2) DEFAULT 0,                     -- 10. HPP
  ppn NUMERIC(14,2) DEFAULT 0,                     -- 11. PPN (11%)
  status VARCHAR(50) DEFAULT 'Pending Approval',   -- 12. Action/Status (Pending, Approved, Revision, Draft)
  item_code VARCHAR(50),
  category VARCHAR(100),
  season VARCHAR(100),
  buyer VARCHAR(100),
  unit VARCHAR(20) DEFAULT 'Pcs',
  delivery_date VARCHAR(30),
  created_date VARCHAR(30),
  approved_by VARCHAR(100),
  approval_date VARCHAR(50),
  approval_notes TEXT,
  buffer_rate NUMERIC(6,4) DEFAULT 0.0250,
  markup_rate NUMERIC(6,4) DEFAULT 0.3000,
  ppn_rate NUMERIC(6,4) DEFAULT 0.1100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Detail Fabric Table: "PrecostingFabric"
CREATE TABLE IF NOT EXISTS "PrecostingFabric" (
  id VARCHAR(50) PRIMARY KEY,
  precosting_id VARCHAR(50) NOT NULL REFERENCES "PrecostingHeader"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  spec TEXT,
  part VARCHAR(100),
  consumption NUMERIC(10,3) NOT NULL DEFAULT 0,
  unit VARCHAR(30) DEFAULT 'Meter',
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0
);

-- 3. Detail Accessories Table: "PrecostingAccessory"
CREATE TABLE IF NOT EXISTS "PrecostingAccessory" (
  id VARCHAR(50) PRIMARY KEY,
  precosting_id VARCHAR(50) NOT NULL REFERENCES "PrecostingHeader"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  spec TEXT,
  qty_per_pcs NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit VARCHAR(30) DEFAULT 'Pcs',
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0
);

-- 4. Detail Services / CMT Table: "PrecostingService"
CREATE TABLE IF NOT EXISTS "PrecostingService" (
  id VARCHAR(50) PRIMARY KEY,
  precosting_id VARCHAR(50) NOT NULL REFERENCES "PrecostingHeader"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'Direct Labor',
  description TEXT,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0
);

-- 5. Detail Remarks Table: "PrecostingRemark"
CREATE TABLE IF NOT EXISTS "PrecostingRemark" (
  id VARCHAR(50) PRIMARY KEY,
  precosting_id VARCHAR(50) NOT NULL REFERENCES "PrecostingHeader"(id) ON DELETE CASCADE,
  author VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  timestamp VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Users Table: "Users"
CREATE TABLE IF NOT EXISTS "Users" (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(50),
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
