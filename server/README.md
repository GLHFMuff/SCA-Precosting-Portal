# Cloth Precosting Portal - Backend API Server

Backend RESTful API berbasis **Node.js + Express** dengan dukungan koneksi ke **PostgreSQL**, serta kalkulasi biaya produksi garmen otomatis (Fabric, Accessories, CMT / Jasa, COGM, HPP, PPN 11%, dan Margin).

---

## 🚀 Fitur Utama
1. **PostgreSQL Database Support**:
   - Terhubung langsung ke **PostgreSQL** (Service default pada port 5432).
   - **Smart Fallback**: Jika database belum dibuat atau password belum diset di `.env`, server secara otomatis menggunakan *Integrated Memory Store* sehingga server tidak pernah crash dan API tetap dapat langsung digunakan untuk testing/development.
2. **REST API Lengkap**:
   - CRUD Precosting data (kain, aksesoris, jasa, target kuantitas).
   - Workflow Approval & Not Approve / Revisi dengan catatan otorisasi.
   - Remarks / Catatan diskusi merchandiser & costing engineer.
   - Dashboard KPI Statistics (Total count, status count, total target Qty, total modal HPP).
   - Autentikasi Pengguna & Role.
   - Endpoint upload gambar style pakaian (Multer).

---

## 📂 Struktur Direktori Backend
```
server/
├── uploads/              # Direktori penyimpanan file upload gambar style
├── src/
│   ├── db/
│   │   ├── connection.js     # Pool PostgreSQL + status check
│   │   ├── schema.sql        # Skema DDL tabel relasional
│   │   ├── seedData.js       # Data awal 6 model pakaian & user
│   │   ├── initDb.js         # Script inisialisasi tabel SQL
│   │   ├── seed.js           # Script seeding data ke PostgreSQL
│   │   └── precostingStore.js# Data Access Layer (SQL + Memory fallback)
│   ├── routes/
│   │   ├── precostingRoutes.js # Endpoint /api/precostings
│   │   ├── dashboardRoutes.js  # Endpoint /api/dashboard/stats
│   │   ├── authRoutes.js       # Endpoint /api/auth
│   │   └── uploadRoutes.js     # Endpoint /api/upload/image
│   ├── utils/
│   │   └── calculations.js   # Financial costing engine (HPP, PPN 11%, dll)
│   └── index.js              # Server entry point Express.js
├── .env                  # Konfigurasi database & port
├── .env.example          # Template konfigurasi
└── package.json          # Dependencies backend
```

---

## 🛠️ Konfigurasi Database (`server/.env`)
Buka file `server/.env` untuk menyesuaikan kredensial PostgreSQL lokal Anda:

```env
PORT=5000
NODE_ENV=development

# Database Driver: PostgreSQL
DB_CLIENT=postgres

# PostgreSQL Configuration
PGHOST=localhost
PGPORT=5432
PGDATABASE=cloth_precosting_portal
PGUSER=postgres
PGPASSWORD=MASUKKAN_PASSWORD_POSTGRES_ANDA_DISINI

# Alternative Full Connection String:
DATABASE_URL=postgresql://postgres:password@localhost:5432/cloth_precosting_portal
```

---

## 📦 Menjalankan Server & Database
Dari root project `d:\MUFF\Web\Cloth Precosting Portal`:

### 1. Menjalankan Server Backend
```bash
npm run server
# atau mode auto-reload dev:
npm run server:dev
```
Server akan aktif di: **`http://localhost:5000`**

### 2. Inisialisasi Tabel & Seeding ke PostgreSQL
Setelah database dibuat di PostgreSQL dan password diset di `.env`:
```bash
npm run db:init   # Membuat semua tabel skema relasional
npm run db:seed   # Memasukkan data awal (users, 6 model precosting, kain, acc, jasa)
```

---

## 🌐 Daftar Endpoint REST API

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Status server & koneksi database |
| `GET` | `/api/precostings` | Ambil semua data precosting (support `?search=`, `?status=`, `?sortBy=`) |
| `GET` | `/api/precostings/:id` | Detail lengkap satu precosting (fabric, acc, jasa, remarks) |
| `POST` | `/api/precostings` | Tambah precosting baru |
| `PUT` | `/api/precostings/:id` | Update data precosting |
| `DELETE` | `/api/precostings/:id` | Hapus data precosting |
| `POST` | `/api/precostings/:id/approve` | Otorisasi / Setujui Precosting |
| `POST` | `/api/precostings/:id/reject` | Tolak / Minta Revisi Precosting |
| `POST` | `/api/precostings/:id/remarks` | Tambah catatan/remarks |
| `GET` | `/api/dashboard/stats` | Ringkasan KPI Dashboard (Qty, Total HPP, Status) |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/users` | Daftar akun pengguna default |
| `POST` | `/api/upload/image` | Upload gambar garmen pakaian |
