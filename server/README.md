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
| `GET` / `POST` | `/api/precostings/confirm-reject` | **Ambil data Confirm & Reject** (Hanya yang `sync_status = "pending"`) |
| `POST` | `/api/precostings/sync-status` | **Update `sync_status` menjadi `"synched"`** (bisa 1 atau banyak `precosting_no` sekaligus) |
| `GET` | `/api/precostings/:id` | Detail lengkap satu precosting (fabric, acc, jasa, remarks) |
| `POST` | `/api/precostings` | Tambah precosting baru (True UPSERT, otomatis `sync_status = "pending"`) |
| `POST` / `PUT` | `/api/precostings/update-image` | **Update Gambar Base64 saja** (`PrecostingNo` & `ProdImage_base64` di body) |
| `POST` / `PUT` | `/api/precostings/:id/image` | **Update Gambar Base64 saja** (`:id` di URL, `ProdImage_base64` di body) |
| `PUT` | `/api/precostings/:id` | Update data precosting |
| `DELETE` | `/api/precostings/:id` | Hapus data precosting |
| `POST` | `/api/precostings/:id/approve` | Otorisasi / Setujui Precosting |
| `POST` / `PUT` | `/api/precostings/:id/reject` | Tolak / Minta Revisi Precosting |
| `POST` | `/api/precostings/:id/remarks` | Tambah catatan/remarks |
| `GET` | `/api/dashboard/stats` | Ringkasan KPI Dashboard (Qty, Total HPP, Status) |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/users` | Daftar akun pengguna default |
| `POST` | `/api/upload/image` | Upload file gambar garmen (FormData multipart) |

---

## 📋 Struktur Baku JSON Payload: `POST /api/precostings` (True UPSERT)

API `POST /api/precostings` telah menggunakan **skema validasi ketat (strict & fixed schema)**. Jika request mengirimkan nama field yang salah, typo, atau di luar daftar baku, server **akan menolak request** dengan status **`HTTP 400 Bad Request`** dan menampilkan daftar field yang tidak valid.

### 🔄 Mekanisme True UPSERT
1. **Jika `PrecostingNo` SUDAH ADA di database**:
   - Server langsung melakukan **UPDATE** pada seluruh field yang dikirim.
   - Field lain yang tidak dikirim akan mempertahankan nilai sebelumnya (tidak ter-reset ke 0).
   - Nilai HPP dan PPN akan otomatis dihitung ulang sesuai data terbaru.
2. **Jika `PrecostingNo` BELUM ADA di database**:
   - Server melakukan **INSERT** record baru ke database PostgreSQL.
   - Mengembalikan data lengkap dengan ID database baru.

---

### 📑 Kamus Field Baku (Fixed Schema)

| Nama Field (Rekomendasi) | Alias (Frontend) | Tipe Data | Status | Keterangan & Nilai Default |
|---|---|---|---|---|
| `PrecostingNo` | `precostingNo` | String | **Wajib** | Nomor unik precosting (misal `"CBD-2610-00005"`, `"PC-2026-001"`). Kunci unik untuk UPSERT. |
| `ProdName` | `itemName` | String | **Wajib** | Nama model / style pakaian (misal `"Kemeja Flanel Katun Kotak"`). |
| `ProdQty` | `targetQty` | Number | Opsional | Kuantitas target pesanan produksi dalam Pcs (Default: `1000`). |
| `Consume` | `consm` | Number | Opsional | Konsumsi pemakaian bahan kain utama per pcs (misal `1.6`). Default: `0`. |
| `FabricPrice` | `fabricPrice` | Number | Opsional | Harga satuan kain per meter / kg (misal `48000`). Default: `0`. |
| `TotalFabricPrice`| `totalFabric` | Number | Opsional | Total biaya kain (`Consume * FabricPrice`). Otomatis dihitung jika tidak dikirim. |
| `CMTPrice` | `cmtPrice` | Number | Opsional | Total biaya jasa CMT (Cutting, Making, Trimming) per pcs (misal `28000`). Default: `0`. |
| `AccPrice` | `accPrice` | Number | Opsional | Total biaya aksesoris, trims, label & polybag per pcs (misal `6000`). Default: `0`. |
| `ProductImage` / `ProdImage_base64` | `image` / `prodImage_base64` | String | Opsional | Gambar model pakaian dalam format Base64 string murni (`data:image/jpeg;base64,...` atau raw base64). |
| `Buyer` | `buyer` | String | Opsional | Nama buyer / pemesan (misal `"Global Buyer"` atau `"Uniqlo"`). Default: `"Global Buyer"`. |
| `Category` | `category` | String | Opsional | Kategori garmen (misal `"Garment"`, `"Kemeja"`, `"Celana"`). Default: `"Garment"`. |
| `DeliveryDate` | `deliveryDate` | String | Opsional | Target tanggal pengiriman (format `"YYYY-MM-DD"`, misal `"2026-11-20"`). |
| `Status` | `status` | String | Opsional | Status dokumen (`"Pending"`, `"Confirmed"`, `"Rejected"`, `"Draft"`). Default: `"Pending"`. |
| `sync_status` | `syncStatus` | String | Opsional | Status sinkronisasi ke sistem eksternal (`"pending"` / `"synched"`). **Default: `"pending"`**. Saat API `POST /api/precostings` dijalankan, nilai otomatis menjadi `"pending"`. |
| `HPP` | `hpp` | Number | Opsional | Harga Pokok Produksi. Otomatis dihitung: `(TotalFabric + CMT + Acc) * 1.025` jika tidak dikirim. |
| `TaxPrice` | `taxPrice` | Number | Opsional | Nilai PPN 11%. Otomatis dihitung: `HPP * 0.11` jika tidak dikirim. |
| `Fabrics` | `fabrics` | Array | Opsional | Rincian jika bahan kain lebih dari 1 jenis (Array of Object). |
| `Accessories` | `accessories` | Array | Opsional | Rincian detail aksesoris & trims (Array of Object). |
| `Services` | `services` | Array | Opsional | Rincian detail jasa per tahapan pengerjaan (Array of Object). |
| `Remarks` | `remarks` | Array | Opsional | Catatan atau riwayat diskusi merchandiser (Array of Object). |

> **⚠️ Peringatan Validasi:**
> - Jika field di luar daftar di atas dikirim (misal: `"nama_kain"`, `"kode_baju"`, `"ConsmRate"`), server akan menolak dengan status **`400 Bad Request`**.
> - Seluruh field numerik (`ProdQty`, `Consume`, `FabricPrice`, `CMTPrice`, `AccPrice`, `HPP`, `TaxPrice`) harus berupa tipe data **Number** valid (bukan string huruf seperti `"abc"`).

---

### 💡 Contoh Request JSON

#### 1. Format Standar (Flat Costing dengan ProdImage_base64)
```json
{
  "PrecostingNo": "CBD-2610-00005",
  "ProdName": "Kemeja Flanel Katun Kotak Regular Fit",
  "ProdQty": 1500,
  "Consume": 1.6,
  "FabricPrice": 48000,
  "CMTPrice": 28000,
  "AccPrice": 6000,
  "ProdImage_base64": "/9j/4AAQSkZJRg...",
  "Buyer": "Uniqlo Indonesia",
  "Category": "Kemeja",
  "DeliveryDate": "2026-11-20",
  "Status": "Pending"
}
```

#### 2. Format Minimal (Hanya Field Wajib)
```json
{
  "PrecostingNo": "CBD-2610-00006",
  "ProdName": "Kaos Polos Cotton Combed 30s"
}
```

#### 3. Format Rinci (Dengan Array Bahan, Aksesoris & Jasa Lengkap)
```json
{
  "PrecostingNo": "PC-2026-007",
  "ProdName": "Jaket Parka Outdoor Canvas",
  "ProdQty": 2000,
  "Buyer": "The North Brand",
  "Category": "Outerwear",
  "DeliveryDate": "2026-12-15",
  "Status": "Pending",
  "Fabrics": [
    {
      "id": "f-1",
      "name": "Kain Canvas Baby Water Repellent",
      "spec": "Cotton Canvas 10oz",
      "part": "Badan Utama",
      "consumption": 2.2,
      "unit": "Meter",
      "unitPrice": 52000
    },
    {
      "id": "f-2",
      "name": "Furing Taffeta 190T",
      "spec": "Polyester Furing",
      "part": "Lapisan Dalam",
      "consumption": 1.5,
      "unit": "Meter",
      "unitPrice": 16000
    }
  ],
  "Accessories": [
    {
      "id": "a-1",
      "name": "Zipper Gigi Besi YKK #5 Open End",
      "spec": "Antik Brass 65cm",
      "qtyPerPcs": 1,
      "unit": "Pcs",
      "unitPrice": 12500
    },
    {
      "id": "a-2",
      "name": "Snap Button Besi 15mm",
      "spec": "Black Nickel",
      "qtyPerPcs": 8,
      "unit": "Pcs",
      "unitPrice": 600
    }
  ],
  "Services": [
    {
      "id": "s-1",
      "name": "Jasa Potong & Bundling",
      "category": "Direct Labor",
      "unitPrice": 3000
    },
    {
      "id": "s-2",
      "name": "Jasa Jahit Assembly Parka",
      "category": "Direct Labor",
      "unitPrice": 27000
    },
    {
      "id": "s-3",
      "name": "QC, Steaming & Individual Polybag",
      "category": "Factory Overhead",
      "unitPrice": 4000
    }
  ]
}
```

---

### 📤 Contoh Respon API

#### A. Respon Sukses (HTTP 201 Created / 200 OK)
```json
{
  "success": true,
  "message": "Precosting CBD-2610-00005 berhasil disimpan ke database",
  "data": {
    "id": "8",
    "precostingNo": "CBD-2610-00005",
    "itemName": "Kemeja Flanel Katun Kotak Regular Fit",
    "targetQty": 1500,
    "consm": 1.6,
    "fabricPrice": 48000,
    "totalFabric": 76800,
    "cmtPrice": 28000,
    "accPrice": 6000,
    "hpp": 113570,
    "taxPrice": 12493,
    "status": "Pending",
    "buyer": "Uniqlo Indonesia",
    "category": "Kemeja",
    "deliveryDate": "2026-11-20",
    "totalFabricCostAllQty": 115200000,
    "totalJasaCostAllQty": 42000000,
    "totalAccCostAllQty": 9000000,
    "cogmPerPcs": 110800,
    "hppPerPcs": 113570,
    "hppAllQty": 170355000,
    "ppnPerPcs": 12493,
    "hppWithPpn": 126063,
    "targetSellingPricePerPcs": 162243
  }
}
```

#### B. Respon Error: Nama Field Salah / Typo (HTTP 400 Bad Request)
```json
{
  "success": false,
  "message": "Nama field tidak valid: [nama_kain, harga_kain]. Harap gunakan nama field baku sesuai dokumentasi server/README.md.",
  "invalidFields": [
    "nama_kain",
    "harga_kain"
  ],
  "standardFields": [
    "PrecostingNo", "ProdName", "ProdQty", "Consume", "FabricPrice",
    "CMTPrice", "AccPrice", "ProductImage", "Buyer", "Category",
    "DeliveryDate", "Status", "Fabrics", "Accessories", "Services", "Remarks"
  ]
}
```

#### C. Respon Error: Field Wajib Kosong (HTTP 400 Bad Request)
```json
{
  "success": false,
  "message": "Field wajib 'PrecostingNo' (string) tidak boleh kosong. Contoh: 'CBD-2610-00005' atau 'PC-2026-001'."
}
```

#### D. Respon Error: Tipe Data Bukan Angka (HTTP 400 Bad Request)
```json
{
  "success": false,
  "message": "Nilai field 'Consume' harus berupa angka (number), diterima: \"satu koma enam\"."
}
```

---

### 💻 Contoh Pemanggilan via cURL & JavaScript Fetch

#### Menggunakan cURL:
```bash
curl -X POST http://localhost:5000/api/precostings \
  -H "Content-Type: application/json" \
  -d '{
    "PrecostingNo": "CBD-2610-00005",
    "ProdName": "Kemeja Flanel Kotak Regular Fit",
    "ProdQty": 1500,
    "Consume": 1.6,
    "FabricPrice": 48000,
    "CMTPrice": 28000,
    "AccPrice": 6000
  }'
```

#### Menggunakan JavaScript / Fetch:
```javascript
const response = await fetch('http://localhost:5000/api/precostings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    PrecostingNo: 'CBD-2610-00005',
    ProdName: 'Kemeja Flanel Kotak Regular Fit',
    ProdQty: 1500,
    Consume: 1.6,
    FabricPrice: 48000,
    CMTPrice: 28000,
    AccPrice: 6000,
    Buyer: 'Global Buyer',
    Category: 'Garment',
  }),
});

const result = await response.json();
console.log(result);
```

---

## 🖼️ Endpoint Khusus: Update Gambar Base64 (`ProdImage_base64`)

Untuk memperbarui foto model pakaian secara terpisah tanpa harus mengirimkan ulang data kain, aksesoris, dan harga, Anda dapat menggunakan endpoint khusus ini.

### 1. Opsi A: `POST` / `PUT` `/api/precostings/update-image`
Nomor precosting disertakan langsung di dalam body JSON.

#### URL Endpoint:
`http://localhost:5001/api/precostings/update-image`

#### Format Payload:
```json
{
  "PrecostingNo": "CBD-2610-00001",
  "ProdImage_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/..."
}
```

*Alias field nomor yang didukung:* `PrecostingNo`, `precostingNo`, `id`  
*Alias field gambar yang didukung:* `ProdImage_base64`, `prodImage_base64`, `ProductImage`, `image`

---

### 2. Opsi B: `POST` / `PUT` `/api/precostings/:id/image`
Nomor precosting diletakkan pada URL path parameter (`:id` diisi `PrecostingNo`).

#### URL Endpoint:
`http://localhost:5001/api/precostings/CBD-2610-00001/image`

#### Format Payload:
```json
{
  "ProdImage_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/..."
}
```

---

### 📤 Respon Sukses (HTTP 200 OK):
```json
{
  "success": true,
  "status": "1",
  "message": "Gambar Base64 untuk Precosting CBD-2610-00001 berhasil diperbarui.",
  "data": {
    "id": "1",
    "precostingNo": "CBD-2610-00001",
    "prodName": "TN NURA LS",
    "hasImage": true,
    "imageLength": 18240
  }
}
```

---

## 📋 Endpoint Ambil Precosting Berdasarkan Status (Mendukung HTTP POST & GET)

Disediakan khusus untuk integrasi dengan aplikasi utama (C# .NET) yang menggunakan `HttpWebRequest` dengan metode **`POST`** (`ShootAPIWithToken`).

### URL Endpoint:
- **`POST http://localhost:5001/api/precostings/confirm-reject`**
- *Atau bisa juga dipanggil ke root:* `POST http://localhost:5001/api/precostings/`
- *Alias URL lainnya yang didukung:* `/api/precostings/processed`, `/api/precostings/query`, `/api/precostings/list`

---

### 📥 Format Payload JSON (Body Request):

> **⚠️ Aturan Sinkronisasi (`sync_status`):**
> Endpoint `api/precostings/confirm-reject` secara default **HANYA mengambil data yang `sync_status`-nya `"pending"`**. Data yang telah diperbarui menjadi `"synched"` tidak akan diambil lagi, sehingga mencegah duplikasi proses sinkronisasi di aplikasi utama.

#### 1. Mengambil Sekaligus Status `confirm` DAN `reject` (Status Kosong):
Jika field `status` dikosongkan (`""`, `null`, atau tidak disertakan `{}`), API secara otomatis mengambil data yang statusnya **`confirm`** (confirmed / approved) dan **`reject`** (reject / revision) dengan `sync_status = "pending"`.
```json
{
  "status": ""
}
```
*(Atau payload kosong `{}`)*

#### 2. Hanya Mengambil Status `reject`:
```json
{
  "status": "reject"
}
```

#### 3. Hanya Mengambil Status `confirm`:
```json
{
  "status": "confirm"
}
```

#### 4. Opsional: Pencarian & Pengurutan Tambahan:
```json
{
  "status": "",
  "search": "TN NURA",
  "sortBy": "date-desc"
}
```

---

### 📤 Contoh Respon Sukses (HTTP 200 OK):
Setiap item di dalam array `data` khusus endpoint ini hanya mengembalikan 3 field utama: **`PrecostingNo`**, **`status`**, dan **`remarks`** sehingga sangat ringan dan hemat bandwidth:

```json
{
  "success": true,
  "status": "1",
  "description": "Daftar Precosting yang sudah diproses (status: confirm & reject)",
  "filter": {
    "status": "",
    "effectiveStatus": "confirm,reject"
  },
  "count": 2,
  "data": [
    {
      "PrecostingNo": "CBD-2610-00001",
      "status": "Confirmed",
      "remarks": "Approved for production"
    },
    {
      "PrecostingNo": "CBD-2610-00005",
      "status": "Rejected",
      "remarks": "Harga kain melebihi budget target"
    }
  ]
}
```

---

### 💻 Contoh Pemanggilan dari C# (.NET):
```csharp
// Contoh 1: Ambil semua yang status reject & confirm
string requestPayload = "{\"status\": \"\"}";
string endpoint = "http://localhost:5001/api/precostings/confirm-reject";
string responseJson = ShootAPIWithToken(requestPayload, endpoint, token);

// Contoh 2: Ambil hanya yang status reject
string rejectPayload = "{\"status\": \"reject\"}";
string rejectJson = ShootAPIWithToken(rejectPayload, endpoint, token);

// Contoh 3: Ambil hanya yang status confirm
string confirmPayload = "{\"status\": \"confirm\"}";
string confirmJson = ShootAPIWithToken(confirmPayload, endpoint, token);
```

---

## 🔄 Endpoint Update `sync_status` Menjadi "synched"

Setelah aplikasi utama berhasil menarik dan memproses data dari endpoint `confirm-reject`, panggil endpoint ini untuk menandai bahwa data telah berhasil disinkronkan (`sync_status = "synched"`).

### URL Endpoint:
- **`POST http://localhost:5001/api/precostings/sync-status`**
- *Atau alias URL:* `/api/precostings/update-sync-status`, `/api/precostings/synched`, `/api/precostings/sync`

---

### 📥 Format Payload JSON (Bisa 1 atau Banyak Sekaligus):

#### Opsi 1: Array of Strings (Rekomendasi untuk batch multiple precosting)
```json
{
  "precosting_no": [
    "CBD-2610-00001",
    "CBD-2610-00005"
  ]
}
```

#### Opsi 2: Single String (Untuk 1 data saja)
```json
{
  "precosting_no": "CBD-2610-00001"
}
```

#### Opsi 3: Array JSON Langsung
```json
[
  "CBD-2610-00001",
  "CBD-2610-00005"
]
```

#### Opsi 4: Array of Objects
```json
[
  { "precosting_no": "CBD-2610-00001" },
  { "precosting_no": "CBD-2610-00005" }
]
```

---

### 📤 Contoh Respon Sukses (HTTP 200 OK):
```json
{
  "success": true,
  "status": "1",
  "error_list": "",
  "message": "Berhasil memperbarui sync_status menjadi 'synched' untuk 2 data precosting",
  "sync_status": "synched",
  "total_requested": 2,
  "total_updated": 2,
  "updated": [
    "CBD-2610-00001",
    "CBD-2610-00005"
  ],
  "not_found": []
}
```

---

### 💻 Contoh Pemanggilan dari C# (.NET):
```csharp
// Mengirim array precosting_no yang telah berhasil disinkronkan ke server lokal
string updatePayload = "{\"precosting_no\": [\"CBD-2610-00001\", \"CBD-2610-00005\"]}";
string syncEndpoint = "http://localhost:5001/api/precostings/sync-status";
string syncResponse = ShootAPIWithToken(updatePayload, syncEndpoint, token);
```



