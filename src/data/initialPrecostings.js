// Initial mock data for Cloth Precosting Portal

export const garmentImageMap = {
  'PC-2026-001': '/images/shirt.jpg',
  'PC-2026-002': '/images/blouse.jpg',
  'PC-2026-003': '/images/hoodie.jpg',
  'PC-2026-004': '/images/chino.jpg',
  'PC-2026-005': '/images/polo.jpg',
  'PC-2026-006': '/images/jacket.jpg',
};

export const calculatePrecostingTotals = (item) => {
  // Image resolution
  const image = item.image || garmentImageMap[item.precostingNo] || '/images/shirt.jpg';

  // Fabric totals
  const fabricCostPerPcs = item.fabrics.reduce(
    (acc, f) => acc + (Number(f.consumption) || 0) * (Number(f.unitPrice) || 0),
    0
  );
  const totalFabricCostAllQty = fabricCostPerPcs * (Number(item.targetQty) || 0);

  // Accessories totals
  const accCostPerPcs = item.accessories.reduce(
    (acc, a) => acc + (Number(a.qtyPerPcs) || 0) * (Number(a.unitPrice) || 0),
    0
  );
  const totalAccCostAllQty = accCostPerPcs * (Number(item.targetQty) || 0);

  // Jasa totals
  const jasaCostPerPcs = item.services.reduce(
    (acc, s) => acc + (Number(s.unitPrice) || 0),
    0
  );
  const totalJasaCostAllQty = jasaCostPerPcs * (Number(item.targetQty) || 0);

  // Direct Material = Fabric + Accessories
  const directMaterialPerPcs = fabricCostPerPcs + accCostPerPcs;
  const directMaterialAllQty = directMaterialPerPcs * (Number(item.targetQty) || 0);

  // Direct Labor (Sewing, Cutting, Buttoning)
  const directLaborPerPcs = item.services
    .filter((s) => s.category === 'Direct Labor')
    .reduce((acc, s) => acc + (Number(s.unitPrice) || 0), 0);
  const directLaborAllQty = directLaborPerPcs * (Number(item.targetQty) || 0);

  // Factory Overhead (Overhead, Pola, Finishing, QC, Packing)
  const factoryOverheadPerPcs = item.services
    .filter((s) => s.category !== 'Direct Labor')
    .reduce((acc, s) => acc + (Number(s.unitPrice) || 0), 0);
  const factoryOverheadAllQty = factoryOverheadPerPcs * (Number(item.targetQty) || 0);

  // COGM (Cost of Goods Manufactured / Biaya Pokok Produksi)
  // COGM = Direct Material + Direct Labor + Factory Overhead = Fabric + Acc + Jasa
  const cogmPerPcs = fabricCostPerPcs + accCostPerPcs + jasaCostPerPcs;
  const cogmAllQty = cogmPerPcs * (Number(item.targetQty) || 0);

  // Operational buffer & packaging/handling (misal 2.5% buffer)
  const bufferRate = item.bufferRate !== undefined ? item.bufferRate : 0.025;
  const bufferPerPcs = Math.round(cogmPerPcs * bufferRate);
  const bufferAllQty = bufferPerPcs * (Number(item.targetQty) || 0);

  // HPP / COGS (Harga Pokok Penjualan)
  const hppPerPcs = cogmPerPcs + bufferPerPcs;
  const hppAllQty = hppPerPcs * (Number(item.targetQty) || 0);

  // Target Selling Price & Margin estimation (Default 30% markup)
  const targetMarkupRate = item.markupRate || 0.30;
  const targetSellingPricePerPcs = Math.round(hppPerPcs / (1 - targetMarkupRate));
  const targetGrossProfitPerPcs = targetSellingPricePerPcs - hppPerPcs;
  const totalRevenueAllQty = targetSellingPricePerPcs * (Number(item.targetQty) || 0);
  const totalProfitAllQty = targetGrossProfitPerPcs * (Number(item.targetQty) || 0);

  return {
    ...item,
    image,
    fabricCostPerPcs,
    totalFabricCostAllQty,
    accCostPerPcs,
    totalAccCostAllQty,
    jasaCostPerPcs,
    totalJasaCostAllQty,
    directMaterialPerPcs,
    directMaterialAllQty,
    directLaborPerPcs,
    directLaborAllQty,
    factoryOverheadPerPcs,
    factoryOverheadAllQty,
    cogmPerPcs,
    cogmAllQty,
    bufferRate,
    bufferPerPcs,
    bufferAllQty,
    hppPerPcs,
    hppAllQty,
    targetMarkupRate,
    targetSellingPricePerPcs,
    targetGrossProfitPerPcs,
    totalRevenueAllQty,
    totalProfitAllQty,
  };
};

export const rawPrecostingData = [
  {
    id: 'pc-1',
    precostingNo: 'PC-2026-001',
    itemName: "Kemeja Pria Oxford Slim Fit Long Sleeve",
    itemCode: 'SHIRT-OXF-01',
    image: '/images/shirt.jpg',
    category: 'Woven Shirt',
    season: 'Spring / Summer 2026',
    buyer: 'The Executive / Metro Group',
    targetQty: 2500,
    unit: 'Pcs',
    deliveryDate: '2026-05-15',
    createdDate: '2026-03-28',
    status: 'Pending Approval', // 'Draft', 'Pending Approval', 'Approved', 'Revision'
    approvedBy: null,
    approvalDate: null,
    fabrics: [
      {
        id: 'f-1',
        name: 'Cotton Oxford Yarn Dyed 40s/2',
        spec: '100% Cotton, Lebar 58", White Melange',
        part: 'Badan & Lengan Utama',
        consumption: 1.60,
        unit: 'Meter',
        unitPrice: 38500,
      },
      {
        id: 'f-2',
        name: 'Interlining / Kain Keras M33 Fusible',
        spec: 'Kerah, Manset & Placket Depan',
        part: 'Kerah & Manset',
        consumption: 0.25,
        unit: 'Meter',
        unitPrice: 14000,
      },
    ],
    accessories: [
      {
        id: 'a-1',
        name: 'Kancing Poliester 18L (4 Lubang)',
        spec: 'Laser Logo Engraved, Pearl White',
        qtyPerPcs: 11,
        unit: 'Pcs',
        unitPrice: 250,
      },
      {
        id: 'a-2',
        name: 'Benang Jahit Spun Poly Astra 40/2',
        spec: 'Tone on Tone match fabric',
        qtyPerPcs: 1,
        unit: 'Cones/Share',
        unitPrice: 850,
      },
      {
        id: 'a-3',
        name: 'Main Label Woven Damask HD',
        spec: 'High Density 5x2.5 cm Soft Edge',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 1200,
      },
      {
        id: 'a-4',
        name: 'Care & Wash Label Satin Ribbon',
        spec: 'Multi-language 7x3 cm',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 450,
      },
      {
        id: 'a-5',
        name: 'Hangtag Set + Barcode + Wax Cord Pin',
        spec: 'Art Paper 350gsm Doff Laminating',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: 1100,
      },
      {
        id: 'a-6',
        name: 'Plastik OPP Garment + Silica Gel Pack',
        spec: 'Thickness 0.04mm with Air Holes',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 750,
      },
      {
        id: 'a-7',
        name: 'Collar Butterfly & Stay Plastic Clip',
        spec: 'Moulded clear PVC collar support',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: 500,
      },
      {
        id: 'a-8',
        name: 'Master Carton Box Double Wall (Share)',
        spec: '1 Box kapasitas 50 pcs kemasan',
        qtyPerPcs: 0.02,
        unit: 'Box',
        unitPrice: 30000,
      },
    ],
    services: [
      {
        id: 's-1',
        name: 'Jasa Desain Pola, Grading & CAD Marker',
        category: 'Factory Overhead',
        description: 'Optimasi efisiensi marker fabric 88%',
        unitPrice: 1200,
      },
      {
        id: 's-2',
        name: 'Jasa Cutting, Numbering & Bundling',
        category: 'Direct Labor',
        description: 'Potong presisi pisau vertikal & numbering panel',
        unitPrice: 2500,
      },
      {
        id: 's-3',
        name: 'Jasa Sewing Perakitan CMT (Line Jahit)',
        category: 'Direct Labor',
        description: 'Jahit kemeja slim fit, jarum 1 stik kecil 14 SPI',
        unitPrice: 18500,
      },
      {
        id: 's-4',
        name: 'Jasa Buttonhole & Pasang Kancing Otomatis',
        category: 'Direct Labor',
        description: '11 lubang kancing + bar tack ujung placket',
        unitPrice: 1500,
      },
      {
        id: 's-5',
        name: 'Jasa Bordir Logo Dada Kiri (Tajima 8.000 Stitches)',
        category: 'Factory Overhead',
        description: 'Bordir monogram emblem benang Madeira',
        unitPrice: 1800,
      },
      {
        id: 's-6',
        name: 'Jasa Steam Pressing Form Ironing & Finishing',
        category: 'Factory Overhead',
        description: 'Setrika uap boiler garment form press',
        unitPrice: 2200,
      },
      {
        id: 's-7',
        name: 'Jasa Quality Control (QC) & Trimming Benang',
        category: 'Factory Overhead',
        description: 'Pembersihan sisa benang & inspeksi AQL 1.5',
        unitPrice: 1300,
      },
      {
        id: 's-8',
        name: 'Biaya Overhead Pabrik & Listrik Operasional',
        category: 'Factory Overhead',
        description: 'Alokasi listrik mesin, maintenance & supervisi',
        unitPrice: 3000,
      },
    ],
    remarks: [
      {
        id: 'rem-1',
        author: 'Rina Kartika (Merchandiser)',
        role: 'Merchandiser',
        timestamp: '2026-03-29 10:15',
        text: 'Yield kain Oxford telah diverifikasi melalui CAD marker dengan efisiensi potongan 88.4%. Kancing menggunakan spek logo laser.',
      },
      {
        id: 'rem-2',
        author: 'Hendra Saputra (Costing Specialist)',
        role: 'Costing Engineer',
        timestamp: '2026-03-30 14:40',
        text: 'Tarif jahit CMT disesuaikan dengan kerumitan saku paspol dan manset bundar 2 kancing. HPP per pcs di angka Rp 107.000.',
      },
    ],
  },
  {
    id: 'pc-2',
    precostingNo: 'PC-2026-002',
    itemName: 'Blouse Wanita Linen Slub Oversized Relaxed',
    itemCode: 'BLOUSE-LIN-02',
    category: 'Woven Blouse',
    season: 'Summer Resort 2026',
    buyer: 'Cottonology Studio',
    targetQty: 4000,
    unit: 'Pcs',
    deliveryDate: '2026-06-20',
    createdDate: '2026-03-25',
    status: 'Approved',
    approvedBy: 'Budi Santoso (Head of Merchandising)',
    approvalDate: '2026-03-27 16:30',
    approvalNotes: 'Spesifikasi linen slub sudah disetujui Buyer. Target margin 32% tercapai.',
    fabrics: [
      {
        id: 'f-201',
        name: 'Pure Linen Slub Pre-Washed 180 GSM',
        spec: '100% French Flax Linen, Lebar 54", Natural Oat',
        part: 'Badan Depan, Belakang & Lengan Balon',
        consumption: 1.50,
        unit: 'Meter',
        unitPrice: 39000,
      },
    ],
    accessories: [
      {
        id: 'a-201',
        name: 'Kancing Batok Kelapa (Coconut Shell 20L)',
        spec: 'Natural polished eco-friendly',
        qtyPerPcs: 6,
        unit: 'Pcs',
        unitPrice: 400,
      },
      {
        id: 'a-202',
        name: 'Benang Jahit Katun Organik 40/2',
        spec: 'Color match linen oat',
        qtyPerPcs: 1,
        unit: 'Cones/Share',
        unitPrice: 700,
      },
      {
        id: 'a-203',
        name: 'Cotton Printed Main Label & Care Label',
        spec: '100% Katun sablon waterbased',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: 1300,
      },
      {
        id: 'a-204',
        name: 'Eco Hangtag Kraft 400gsm + Jute String',
        spec: 'Daur ulang ramah lingkungan',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: 900,
      },
      {
        id: 'a-205',
        name: 'Biodegradable Cassava Bag Packaging',
        spec: 'Kantong singkong degradable 30x40 cm',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 900,
      },
    ],
    services: [
      {
        id: 's-201',
        name: 'Jasa Pattern Grading & Pola Blouse',
        category: 'Factory Overhead',
        description: 'Fitting loose silhouette dengan dropped shoulder',
        unitPrice: 1000,
      },
      {
        id: 's-202',
        name: 'Jasa Cutting & Pemilahan Serat Kain',
        category: 'Direct Labor',
        description: 'Potong manual hati-hati tekstur linen',
        unitPrice: 2000,
      },
      {
        id: 's-203',
        name: 'Jasa Sewing CMT Assembly (Jahit Halus)',
        category: 'Direct Labor',
        description: 'Jahit stik balik / french seam premium',
        unitPrice: 16500,
      },
      {
        id: 's-204',
        name: 'Jasa Soft Chemical Bio-Silicone Washing',
        category: 'Factory Overhead',
        description: 'Washing garmen untuk handfeel lemas & anti-susut',
        unitPrice: 3500,
      },
      {
        id: 's-205',
        name: 'Jasa Steam Finishing, QC & Packaging',
        category: 'Factory Overhead',
        description: 'Steam hanging iron dan packing rapi',
        unitPrice: 3500,
      },
    ],
    remarks: [
      {
        id: 'rem-201',
        author: 'Siti Aminah (Buyer QC)',
        role: 'Merchandiser',
        timestamp: '2026-03-26 11:00',
        text: 'Washing bio-silicone sudah lolos lab test pilling level 4 dan shrinkage < 2%.',
      },
    ],
  },
  {
    id: 'pc-3',
    precostingNo: 'PC-2026-003',
    itemName: 'Hoodie Pullover Heavyweight Cotton Fleece 330 GSM',
    itemCode: 'HOODIE-FLC-03',
    category: 'Outerwear (Knitting)',
    season: 'Autumn / Winter 2026',
    buyer: 'Streetwear Brand Syndicate',
    targetQty: 1800,
    unit: 'Pcs',
    deliveryDate: '2026-07-30',
    createdDate: '2026-03-30',
    status: 'Draft',
    approvedBy: null,
    approvalDate: null,
    fabrics: [
      {
        id: 'f-301',
        name: 'Heavy Cotton Fleece CVC 330 GSM',
        spec: 'Kain tebal garuk lembut, Lebar 72" tubular, Deep Black',
        part: 'Badan, Lengan & Kupluk Double Layer',
        consumption: 1.85,
        unit: 'Kg',
        unitPrice: 42000,
      },
      {
        id: 'f-302',
        name: 'Rib 1x1 Cotton Spandex Tebal Matching',
        spec: 'Manset tangan & ban pinggang elastis',
        part: 'Manset & Ban Pinggang',
        consumption: 0.15,
        unit: 'Kg',
        unitPrice: 46000,
      },
    ],
    accessories: [
      {
        id: 'a-301',
        name: 'Tali Hoodie Katun Pipih Kepang 12mm',
        spec: 'Panjang 135 cm dengan metal aglet tip hitam doff',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 3200,
      },
      {
        id: 'a-302',
        name: 'Eyelet Logam Lubang Tali Black Gunmetal',
        spec: 'Anti karat 12mm washer set',
        qtyPerPcs: 2,
        unit: 'Pcs',
        unitPrice: 600,
      },
      {
        id: 'a-303',
        name: 'High Density Jacquard Woven Neck & Hem Label',
        spec: 'Fold center label leher & woven tab saku',
        qtyPerPcs: 2,
        unit: 'Pcs',
        unitPrice: 1500,
      },
      {
        id: 'a-304',
        name: 'Thick OPP Polybag 0.05 + Master Box Share',
        spec: 'Dus kapasitas 20 pcs hoodie tebal',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: 2600,
      },
    ],
    services: [
      {
        id: 's-301',
        name: 'Jasa Pembuatan Pola & Cutting Fleece',
        category: 'Direct Labor',
        description: 'Potong rajut fleece berat arah serat stabil',
        unitPrice: 3000,
      },
      {
        id: 's-302',
        name: 'Jasa Sablon Plastisol High Density 4 Warna',
        category: 'Factory Overhead',
        description: 'Screen print dada & punggung curing suhu tinggi',
        unitPrice: 8500,
      },
      {
        id: 's-303',
        name: 'Jasa Sewing Jahit Overdeck & Obras 5 Benang',
        category: 'Direct Labor',
        description: 'Kangaroo pocket bartack kuat, stik rantai leher',
        unitPrice: 17000,
      },
      {
        id: 's-304',
        name: 'Jasa Finishing, QC Saku & Steaming Uap',
        category: 'Factory Overhead',
        description: 'Pembersihan bulu kain, metal detector & packing',
        unitPrice: 3500,
      },
    ],
    remarks: [
      {
        id: 'rem-301',
        author: 'Fajar Nugraha (Merchandiser)',
        role: 'Merchandiser',
        timestamp: '2026-03-31 08:30',
        text: 'Penyesuaian kupluk double layer meningkatkan konsumsi kain fleece dari 1.65 kg menjadi 1.85 kg.',
      },
    ],
  },
  {
    id: 'pc-4',
    precostingNo: 'PC-2026-004',
    itemName: 'Celana Panjang Pria Chino Stretch Twill Regular Fit',
    itemCode: 'CHINO-STR-04',
    category: 'Pants / Bottoms',
    season: 'All Year Basics 2026',
    buyer: 'Urban Outfitters Apparel',
    targetQty: 3200,
    unit: 'Pcs',
    deliveryDate: '2026-06-01',
    createdDate: '2026-03-24',
    status: 'Pending Approval',
    approvedBy: null,
    approvalDate: null,
    fabrics: [
      {
        id: 'f-401',
        name: 'Cotton Twill Stretch 10 oz (98% Ctn 2% Spx)',
        spec: 'Lebar 58", Khaki Camel Tan, reactive dyed',
        part: 'Badan Celana Luar',
        consumption: 1.45,
        unit: 'Yard',
        unitPrice: 47000,
      },
      {
        id: 'f-402',
        name: 'Kain Kantong TC Pocketing Blacu Halus 45"',
        spec: 'Kain lapis kantong dalam anti robek',
        part: 'Kantong Depan & Belakang',
        consumption: 0.35,
        unit: 'Yard',
        unitPrice: 17000,
      },
    ],
    accessories: [
      {
        id: 'a-401',
        name: 'Resleting YKK Metal Zipper Brass #4 (18cm)',
        spec: 'Original YKK Semi Auto-Lock brass slider',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 4500,
      },
      {
        id: 'a-402',
        name: 'Kancing Metal Jeans Shank + Rivet Saku',
        spec: 'Gunmetal embossed logo brand',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: 1800,
      },
      {
        id: 'a-403',
        name: 'Ban Pinggang Interlining Kufner Elastis',
        spec: 'Penguat ban pinggang fleksibel',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 1800,
      },
      {
        id: 'a-404',
        name: 'Leather Patch Kulit Sintetis Pinggang Belakang',
        spec: 'Embossed deboss hot stamp brand',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 2200,
      },
      {
        id: 'a-405',
        name: 'Main & Care Label + Barcode Hangtag + Polybag',
        spec: 'Set aksesoris finishing retail lengkap',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: 3500,
      },
    ],
    services: [
      {
        id: 's-401',
        name: 'Jasa Cutting Twill Stretch & Fusible Interlining',
        category: 'Direct Labor',
        description: 'Potong presisi dengan relaksasi kain 24 jam',
        unitPrice: 2800,
      },
      {
        id: 's-402',
        name: 'Jasa Jahit Celana Chino (CMT Bottoms)',
        category: 'Direct Labor',
        description: 'Jahit rantai pesak, pasang saku bibir 2, ban pinggang',
        unitPrice: 21500,
      },
      {
        id: 's-403',
        name: 'Jasa Garment Enzyme Wash & Softener Treatment',
        category: 'Factory Overhead',
        description: 'Proses cuci enzyme pabrik laundry untuk kenyamanan',
        unitPrice: 5500,
      },
      {
        id: 's-404',
        name: 'Jasa QC Bartack Pasang Kancing & Pressing Celana',
        category: 'Factory Overhead',
        description: 'Mesin steam lipatan celana & inspeksi jahitan',
        unitPrice: 5200,
      },
    ],
    remarks: [
      {
        id: 'rem-401',
        author: 'Dedi Kusuma (Head Production)',
        role: 'Merchandiser',
        timestamp: '2026-03-25 15:00',
        text: 'Kain stretch twill wajib direlaksasi gelar minimal 24 jam sebelum potong untuk mencegah celana menyusut.',
      },
    ],
  },
  {
    id: 'pc-5',
    precostingNo: 'PC-2026-005',
    itemName: 'Kaos Polo Pique Cotton Combed 24s Kerah Rajut',
    itemCode: 'POLO-PIQ-05',
    category: 'Polo Shirt',
    season: 'Corporate Uniform 2026',
    buyer: 'PT Astra International Tbk',
    targetQty: 6000,
    unit: 'Pcs',
    deliveryDate: '2026-05-30',
    createdDate: '2026-03-20',
    status: 'Approved',
    approvedBy: 'Budi Santoso (Head of Merchandising)',
    approvalDate: '2026-03-22 14:10',
    approvalNotes: 'Approved full batch 6.000 pcs sesuai approval master sample.',
    fabrics: [
      {
        id: 'f-501',
        name: 'Cotton Pique Lacoste Combed 24s',
        spec: '100% Katun Combed, Lebar 45" tubular, Navy Blue',
        part: 'Badan Depan, Belakang & Lengan',
        consumption: 0.38,
        unit: 'Kg',
        unitPrice: 104000,
      },
      {
        id: 'f-502',
        name: 'Kerah & Manset Rajut Flat Knit Custom 2 Garis',
        spec: 'Kerah rajut tebal anti letoy dengan corak kontras',
        part: 'Kerah Leher & Manset Lengan',
        consumption: 1,
        unit: 'Set',
        unitPrice: 3000,
      },
    ],
    accessories: [
      {
        id: 'a-501',
        name: 'Kancing Poliester Corak Kerang 18L (3 Lubang/Placket)',
        spec: 'Laser gravir nama perusahaan',
        qtyPerPcs: 3,
        unit: 'Pcs',
        unitPrice: 300,
      },
      {
        id: 'a-502',
        name: 'Kain Keras Placket Fusible non-woven',
        spec: 'Pelekat placket kancing agar kaku rapi',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 400,
      },
      {
        id: 'a-503',
        name: 'Woven Label Leher + Size + Care Label',
        spec: 'Satin & woven kombinasi rapi',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: 1200,
      },
      {
        id: 'a-504',
        name: 'Polybag Satuan + Hangtag Perusahaan',
        spec: 'Plastik jinjing klip rapi',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 1500,
      },
      {
        id: 'a-505',
        name: 'Master Box Ekspedisi per 50 pcs (Share)',
        spec: 'Box karton tebal pengiriman luar kota',
        qtyPerPcs: 0.02,
        unit: 'Box',
        unitPrice: 25000,
      },
    ],
    services: [
      {
        id: 's-501',
        name: 'Jasa Potong Pola Kaos Polo Rajut',
        category: 'Direct Labor',
        description: 'Potong presisi serasi alur salur pique',
        unitPrice: 1500,
      },
      {
        id: 's-502',
        name: 'Jasa Bordir Komputer Logo Dada & Belakang',
        category: 'Factory Overhead',
        description: 'Bordir benang presisi 12.000 stitches',
        unitPrice: 3200,
      },
      {
        id: 's-503',
        name: 'Jasa Jahit Placket, Pasang Kerah & Jahit CMT',
        category: 'Direct Labor',
        description: 'Jahit rantai pundak, pasang placket segitiga rapi',
        unitPrice: 7500,
      },
      {
        id: 's-504',
        name: 'Jasa Pasang Kancing & Lubang Kancing',
        category: 'Direct Labor',
        description: '3 pasang kancing pada placket',
        unitPrice: 800,
      },
      {
        id: 's-505',
        name: 'Jasa Finishing, Uap Steam & Lipat Kemas',
        category: 'Factory Overhead',
        description: 'Setrika uap polo dan packing master carton',
        unitPrice: 2200,
      },
    ],
    remarks: [
      {
        id: 'rem-501',
        author: 'Rina Kartika (Merchandiser)',
        role: 'Merchandiser',
        timestamp: '2026-03-21 17:15',
        text: 'Bahan Combed 24s Navy sudah celup lot besar, warna seragam dengan toleransi delta E < 0.8.',
      },
    ],
  },
  {
    id: 'pc-6',
    precostingNo: 'PC-2026-006',
    itemName: 'Jaket Windbreaker Taslan Waterproof Reversible',
    itemCode: 'JKT-TASL-06',
    category: 'Outerwear / Jacket',
    season: 'Monsoon Adventure 2026',
    buyer: 'Eiger Adventure Lifestyle',
    targetQty: 1200,
    unit: 'Pcs',
    deliveryDate: '2026-08-10',
    createdDate: '2026-04-02',
    status: 'Revision',
    approvedBy: null,
    approvalDate: null,
    approvalNotes: 'Mohon revisi tarif jasa seam-seal tape dan cek ulang harga zipper reversible YKK.',
    fabrics: [
      {
        id: 'f-601',
        name: 'Taslan Milky Coating Waterproof 10.000mm',
        spec: 'Polyester Taslan Ripstop WR / PU Coating',
        part: 'Badan Luar Shell',
        consumption: 1.70,
        unit: 'Yard',
        unitPrice: 42000,
      },
      {
        id: 'f-602',
        name: 'Puring Poly Mesh Breathable Quick-Dry',
        spec: 'Kain jaring lining dalam lembut',
        part: 'Badan Dalam / Lining',
        consumption: 1.40,
        unit: 'Yard',
        unitPrice: 12500,
      },
    ],
    accessories: [
      {
        id: 'a-601',
        name: 'YKK Reversible Visulon Open-End Zipper #5 (70cm)',
        spec: 'Kepala resleting bolak-balik waterproof puller',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 10500,
      },
      {
        id: 'a-602',
        name: 'YKK Pocket Zipper Coil Invisible #3 (18cm)',
        spec: '2 buah saku samping kanan-kiri',
        qtyPerPcs: 2,
        unit: 'Pcs',
        unitPrice: 2000,
      },
      {
        id: 'a-603',
        name: 'Stopper Tali Plastik Duraflex + Tali Elastis Eiger',
        spec: 'Adjuster pinggang & kupluk hoodie',
        qtyPerPcs: 2,
        unit: 'Set',
        unitPrice: 1500,
      },
      {
        id: 'a-604',
        name: 'Rubber Silicone Patch Badge Logo Lengan',
        spec: 'High quality 3D rubber emblem',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 2200,
      },
      {
        id: 'a-605',
        name: 'Seam Sealing Tape PU Hot Melt (per pcs)',
        spec: 'Pita pelapis kedap air jahitan bahu & kupluk',
        qtyPerPcs: 1,
        unit: 'Pcs',
        unitPrice: 3800,
      },
      {
        id: 'a-606',
        name: 'Hangtag Booklet + Polybag Klip + Box Share',
        spec: 'Kemasan retail premium outdoor',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: 3000,
      },
    ],
    services: [
      {
        id: 's-601',
        name: 'Jasa Potong Kain Waterproof & Mesh Lining',
        category: 'Direct Labor',
        description: 'Potong ganda presisi pisau putar',
        unitPrice: 3500,
      },
      {
        id: 's-602',
        name: 'Jasa Hot Air Seam Sealing Mesin Tape',
        category: 'Factory Overhead',
        description: 'Penempelan tape kedap air pada sambungan jahitan',
        unitPrice: 4500,
      },
      {
        id: 's-603',
        name: 'Jasa Sewing Jaket Bolak-Balik Komplit',
        category: 'Direct Labor',
        description: 'Pemasangan zipper reversible, lining kantong, karet',
        unitPrice: 24500,
      },
      {
        id: 's-604',
        name: 'Jasa QC Uji Semprot Air (Water-Spray Test)',
        category: 'Factory Overhead',
        description: 'Sampling uji kebocoran air tekanan air 5 bar',
        unitPrice: 2000,
      },
      {
        id: 's-605',
        name: 'Jasa Steam Finishing, QC & Pengepakan',
        category: 'Factory Overhead',
        description: 'Inspeksi detail tarikan zipper dan packing hangtag',
        unitPrice: 3500,
      },
    ],
    remarks: [
      {
        id: 'rem-601',
        author: 'Hendra Saputra (Costing Specialist)',
        role: 'Costing Engineer',
        timestamp: '2026-04-03 10:45',
        text: 'Buyer meminta penghematan biaya pada seam sealing tape. Sedang dicari vendor tape lokal grade militer yang lebih ekonomis.',
      },
    ],
  },
];

export const getInitialPrecostings = () => {
  return rawPrecostingData.map(calculatePrecostingTotals);
};
