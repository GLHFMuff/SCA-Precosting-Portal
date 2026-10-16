-- PostgreSQL Schema for Cloth Precosting Portal
-- Database: cloth_precosting_portal

-- 1. Main Header Table: "PrecostingHeader"
CREATE TABLE IF NOT EXISTS "PrecostingHeader" (
  id BIGSERIAL PRIMARY KEY,
  "PrecostingNo" VARCHAR(100) NOT NULL,
  "ProdImage_base64" TEXT,
  "ProductImage" TEXT,
  "ProdName" VARCHAR(255) NOT NULL,
  "ProdQty" NUMERIC(14,2) NOT NULL DEFAULT 1000,
  "Consume" NUMERIC(10,3) DEFAULT 0,
  "FabricPrice" NUMERIC(16,2) DEFAULT 0,
  "TotalFabricPrice" NUMERIC(16,2) DEFAULT 0,
  "CMTPrice" NUMERIC(16,2) DEFAULT 0,
  "AccPrice" NUMERIC(16,2) DEFAULT 0,
  "HPP" NUMERIC(16,2) DEFAULT 0,
  "TaxPrice" NUMERIC(16,2) DEFAULT 0,
  "Status" VARCHAR(50) DEFAULT 'Pending Approval',
  "Buyer" VARCHAR(100),
  "Category" VARCHAR(100),
  "DeliveryDate" VARCHAR(50),
  "ApprovedBy" VARCHAR(100),
  "ApprovalDate" VARCHAR(50),
  "ApprovedDate" VARCHAR(50),
  "ApprovalNotes" TEXT,
  "Fabrics" JSONB DEFAULT '[]'::jsonb,
  "Accessories" JSONB DEFAULT '[]'::jsonb,
  "Services" JSONB DEFAULT '[]'::jsonb,
  "Remarks" JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique index for case-insensitive PrecostingNo
CREATE UNIQUE INDEX IF NOT EXISTS idx_precosting_header_precosting_no_unique 
ON "PrecostingHeader" (LOWER(TRIM("PrecostingNo")));

-- 2. Users Table for Authentication
CREATE TABLE IF NOT EXISTS "Users" (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(50),
  avatar VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
