# PRECOSTEX - Cloth & Garment Precosting Portal

Portal manajemen precosting garmen/pakaian terstruktur dengan perhitungan otomatis biaya **Fabric (Kain)**, **Accessories (Trims & Packaging)**, **Jasa CMT (Cutting, Sewing, Finishing & Overhead)**, analisis akuntansi **COGM (Cost of Goods Manufactured)**, **COGS / HPP (Harga Pokok Penjualan)**, target margin keuntungan, fitur **Remarks/Catatan**, serta alur **Approval dengan Summary Window Konfirmasi**.

Portal dirancang responsif dan nyaman digunakan baik di **Laptop / Desktop** maupun di **Smartphone / HP**.

---

## 🚀 Cara Menjalankan Project

Server lokal sudah aktif dan dapat dibuka langsung melalui browser:
```bash
npm run dev
```
Akses di browser Anda: **[http://localhost:5173/](http://localhost:5173/)**

---

## 🌟 Fitur Utama

### 1. Halaman Login Otorisasi & Demo Role
- Tampilan login elegan dan profesional.
- **1-Click Demo Login** dengan 3 profil pengguna garmen:
  - **Rina Kartika** (Merchandiser Lead): Pembuat costing kain & spek aksesoris.
  - **Hendra Saputra** (Costing Specialist): Penentuan tarif CMT & yield efisiensi.
  - **Budi Santoso** (Approval Authority / Director): Otorisasi final HPP & margin.

### 2. Dashboard KPI Overview
- **Total Precosting**: Jumlah seluruh model pakaian.
- **Menunggu Approval**: Precosting yang memerlukan review dan otorisasi.
- **Sudah Disetujui**: Model pakaian yang telah disetujui untuk diproduksi.
- **Target Qty Produksi**: Akumulasi total kuantitas seluruh batch pakaian.
- **Total Estimasi HPP**: Nilai total modal produksi terhitung dalam Rupiah (IDR).

### 3. Tampilan Awal Grid Precosting (Responsive Table & Card Mode)
Menampilkan kolom-kolom utama sesuai kebutuhan garmen:
1. **Nomor Urut**
2. **Nomor Precosting** (misal: `PC-2026-001`)
3. **Nama Item Pakaian** (dengan kategori & buyer)
4. **Total Harga Fabric per Kain (Pcs)**
5. **Total Harga Accessories per Kain (Pcs)**
6. **Total Harga Jasa per Kain (Pcs)**
7. **Target Qty yang Mau Dibuat**
8. **HPP per Kain (Pcs)**
9. **Biaya Semua Qty (Total HPP)**
10. **Status Badge** (Draft, Menunggu Otorisasi, Disetujui, Perlu Revisi)
11. **Aksi**:
    - **Detail**: Membuka halaman telaah mendalam.
    - **Remarks**: Membuka popup catatan & diskusi teknis.
    - **Approve**: Membuka jendela ringkasan konfirmasi & otorisasi.
- **Mobile Card View**: Mode kartu otomatis atau tombol toggle pada layar smartphone (HP) agar mudah di-scroll dan nyaman dilihat tanpa tabel terjepit.

### 4. Tampilan Detail Precosting
Pemetaan menyeluruh seluruh komponen:
- **Detail Item**: Nomor precosting, kode item, buyer, kategori, target qty, estimasi delivery, dan status approval.
- **Section 1: Detail Fabric**:
  - Nama kain, spesifikasi konstruksi, bagian garmen, konsumsi per pcs, satuan, harga satuan, total biaya per pcs, dan total biaya semua qty.
  - Subtotal otomatis biaya kain.
- **Section 2: Detail Accessories**:
  - Kancing, benang, woven label, care label, hangtag, polybag, master carton.
  - Kuantitas per potong, satuan, harga satuan, biaya per pcs, dan biaya semua qty.
- **Section 3: Detail Jasa (CMT & Proses)**:
  - Pola CAD marker, potong (cutting), jahit perakitan CMT, sablon/bordir, wash treatment, finishing boiler, QC, dan overhead pabrik.
  - Klasifikasi akuntansi (*Direct Labor* vs *Factory Overhead*).
- **Section 4: Analisa Finansial COGS, COGM & HPP**:
  - **Direct Material** = Fabric + Accessories
  - **Direct Labor** = Upah pemotongan & penjahitan CMT
  - **Factory Overhead** = Listrik, supervisi, finishing & QC
  - **COGM (Biaya Pokok Produksi)** = Direct Material + Direct Labor + Factory Overhead
  - **Buffer Penyusutan & Handling** (2.5%)
  - **HPP / COGS (Harga Pokok Penjualan)** = Total modal per potong dan semua qty.
  - Rekomendasi harga jual (FOB) berdasarkan target markup/margin garmen.
- **Section 5: Catatan / Remarks**:
  - Riwayat catatan teknis (penyusutan kain, toleransi ukuran, instruksi jahitan).
  - Form kirim remarks instan dengan informasi user & waktu posting.
- **Fitur Cetak / PDF**: Format bersih otomatis siap cetak saat menekan tombol "Cetak / PDF".

### 5. Jendela Konfirmasi & Summary Approval
- Tersedia baik di **Grid** maupun di **View Detail**.
- Menampilkan ringkasan menyeluruh:
  - Nomor Precosting & Nama Item
  - Target Qty
  - Total Biaya Fabric
  - Total Biaya Accessories
  - Total Biaya Jasa
  - COGM per Pcs & Semua Qty
  - HPP per Pcs & Semua Qty
  - Catatan otorisasi / feedback revisi.
  - Tombol **Konfirmasi & Approve** dan **Minta Revisi**.

---

## 📁 Struktur Folder Project

```
Cloth Precosting Portal/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── context/
│   │   └── PrecostingContext.jsx      # State management, formula & local storage
│   ├── data/
│   │   └── initialPrecostings.js      # Mock data garmen dengan formula dinamis
│   ├── utils/
│   │   └── formatters.js              # Formatter Rupiah, angka & tanggal
│   └── components/
│       ├── auth/
│       │   └── Login.jsx              # Halaman login modern & akun demo
│       ├── layout/
│       │   ├── Header.jsx             # Top bar navigasi & profile
│       │   └── MobileDrawer.jsx       # Drawer menu khusus smartphone/HP
│       ├── dashboard/
│       │   ├── SummaryStats.jsx       # KPI cards
│       │   └── PrecostingGrid.jsx     # Grid utama (table & card mobile)
│       ├── detail/
│       │   └── PrecostingDetail.jsx   # Rincian fabric, acc, jasa, COGM & HPP
│       ├── modals/
│       │   ├── ApprovalModal.jsx      # Summary window & konfirmasi approval
│       │   ├── RemarksModal.jsx       # Popup remarks langsung dari grid
│       │   └── NewPrecostingModal.jsx # Form tambah precosting baru
│       └── common/
│           └── Toast.jsx              # Notifikasi interaktif
```
