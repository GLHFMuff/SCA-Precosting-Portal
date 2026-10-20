// Precosting calculation utilities & empty initial store (no dummy data)

export const garmentImageMap = {
  'PC-2026-001': '/images/shirt.jpg',
  'PC-2026-002': '/images/blouse.jpg',
  'PC-2026-003': '/images/hoodie.jpg',
  'PC-2026-004': '/images/chino.jpg',
  'PC-2026-005': '/images/polo.jpg',
  'PC-2026-006': '/images/jacket.jpg',
};

export const normalizeStatus = (val) => {
  if (!val || typeof val !== 'string') return 'Pending';
  const s = val.trim().toLowerCase();
  if (s === 'confirmed' || s === 'confirm' || s === 'approved') return 'Confirmed';
  if (s === 'rejected' || s === 'reject' || s === 'revision') return 'Rejected';
  if (s === 'pending' || s === 'pending approval' || s === 'menunggu approval') return 'Pending';
  return 'Pending';
};

export const calculatePrecostingTotals = (item) => {
  if (!item) return item;

  const status = normalizeStatus(item.status || item.Status);
  const sync_status = (item.sync_status || item.SyncStatus || item.syncStatus || 'pending').toLowerCase();

  // Image resolution (Base64 from database or fallback)
  const image = item.image || item.ProductImage || garmentImageMap[item.precostingNo] || '';

  const targetQty = Number(item.targetQty || item.ProdQty || 1000);

  // Consm
  const consmInput = Number(
    item.consm ??
    item.Consume ??
    item.consume ??
    item.mainFabricConsumption ??
    item.savedConsm ??
    0
  );

  // Fabric Price per unit
  const fabricPriceInput = Number(
    item.fabricPrice ??
    item.FabricPrice ??
    item.hargaFabric ??
    item.mainFabricUnitPrice ??
    item.savedHargaFabric ??
    0
  );

  // Total Fabric (can be per-pcs or lot total)
  let totalFabricInput = Number(
    item.totalFabric ??
    item.TotalFabricPrice ??
    item.totalKain ??
    item.fabricCostPerPcs ??
    item.savedTotalKain ??
    (consmInput > 0 && fabricPriceInput > 0 ? consmInput * fabricPriceInput : 0)
  );

  let fabrics = Array.isArray(item.fabrics) ? item.fabrics : [];
  let accessories = Array.isArray(item.accessories) ? item.accessories : [];
  let services = Array.isArray(item.services) ? item.services : [];

  // If totalFabricInput is lot total (e.g. 11,000,000 for 1000 pcs), normalize per pcs
  let fabricCostPerPcs = fabrics.reduce(
    (acc, f) => acc + (Number(f.consumption) || 0) * (Number(f.unitPrice) || 0),
    0
  );

  if (fabricCostPerPcs === 0) {
    if (totalFabricInput > 100000 && targetQty > 1 && (fabricPriceInput === 0 || totalFabricInput > fabricPriceInput * 2)) {
      fabricCostPerPcs = Math.round(totalFabricInput / targetQty);
    } else {
      fabricCostPerPcs = totalFabricInput > 0 ? totalFabricInput : (consmInput * fabricPriceInput);
    }
  }

  const totalFabricCostAllQty = fabricCostPerPcs * targetQty;

  // Primary fabric info
  if (fabrics.length === 0 && (fabricPriceInput > 0 || consmInput > 0 || fabricCostPerPcs > 0)) {
    fabrics = [
      {
        id: `f-${item.id || Date.now()}-1`,
        name: item.fabricName || 'Main Fabric',
        spec: item.fabricSpec || 'Standard Fabric Spec',
        part: 'Body',
        consumption: consmInput || 1,
        unit: item.fabricUnit || 'Meter',
        unitPrice: fabricPriceInput > 0 ? fabricPriceInput : fabricCostPerPcs,
      },
    ];
  }

  const primaryFabric = fabrics.length > 0 ? fabrics[0] : null;
  const mainFabricConsumption = primaryFabric ? Number(primaryFabric.consumption) || 0 : consmInput;
  const mainFabricUnitPrice = primaryFabric ? Number(primaryFabric.unitPrice) || 0 : (fabricPriceInput > 0 ? fabricPriceInput : fabricCostPerPcs);
  const mainFabricUnit = primaryFabric?.unit || 'Meter';
  const totalConsumption = fabrics.length > 0
    ? Number(fabrics.reduce((sum, f) => sum + (Number(f.consumption) || 0), 0).toFixed(2))
    : mainFabricConsumption;

  // CMT / Jasa Price
  const cmtInput = Number(
    item.cmtPrice ??
    item.CMTPrice ??
    item.hargaCmt ??
    item.jasaCostPerPcs ??
    item.savedHargaCmt ??
    0
  );

  let jasaCostPerPcs = services.reduce(
    (acc, s) => acc + (Number(s.unitPrice) || 0),
    0
  );

  if (jasaCostPerPcs === 0) {
    if (cmtInput > 500000 && targetQty > 1) {
      jasaCostPerPcs = Math.round(cmtInput / targetQty);
    } else {
      jasaCostPerPcs = cmtInput;
    }
  }

  const totalJasaCostAllQty = jasaCostPerPcs * targetQty;

  if (services.length === 0 && jasaCostPerPcs > 0) {
    services = [
      {
        id: `s-${item.id || Date.now()}-1`,
        name: 'CMT Service (Cutting, Making, Trimming)',
        category: 'Direct Labor',
        description: 'Total jasa CMT per pcs',
        unitPrice: jasaCostPerPcs,
      },
    ];
  }

  // Accessories Price
  const accInput = Number(
    item.accPrice ??
    item.AccPrice ??
    item.hargaAccessories ??
    item.accCostPerPcs ??
    item.savedHargaAccessories ??
    0
  );

  let accCostPerPcs = accessories.reduce(
    (acc, a) => acc + (Number(a.qtyPerPcs) || 0) * (Number(a.unitPrice) || 0),
    0
  );

  if (accCostPerPcs === 0) {
    if (accInput > 50000 && targetQty > 1 && (item.hpp ? accInput > Number(item.hpp) : true)) {
      accCostPerPcs = Math.round(accInput / targetQty);
    } else {
      accCostPerPcs = accInput;
    }
  }

  const totalAccCostAllQty = accCostPerPcs * targetQty;

  if (accessories.length === 0 && accCostPerPcs > 0) {
    accessories = [
      {
        id: `a-${item.id || Date.now()}-1`,
        name: 'Trims & Accessories Package',
        spec: 'Complete package per pcs',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: accCostPerPcs,
      },
    ];
  }

  // Direct Material & Direct Labor
  const directMaterialPerPcs = fabricCostPerPcs + accCostPerPcs;
  const directMaterialAllQty = directMaterialPerPcs * targetQty;

  const directLaborPerPcs = services
    .filter((s) => s.category === 'Direct Labor')
    .reduce((acc, s) => acc + (Number(s.unitPrice) || 0), 0) || jasaCostPerPcs;
  const directLaborAllQty = directLaborPerPcs * targetQty;

  const factoryOverheadPerPcs = services
    .filter((s) => s.category !== 'Direct Labor')
    .reduce((acc, s) => acc + (Number(s.unitPrice) || 0), 0);
  const factoryOverheadAllQty = factoryOverheadPerPcs * targetQty;

  // COGM
  const cogmPerPcs = fabricCostPerPcs + accCostPerPcs + jasaCostPerPcs;
  const cogmAllQty = cogmPerPcs * targetQty;

  // Buffer (default 2.5%)
  const bufferRate = item.bufferRate !== undefined ? Number(item.bufferRate) : 0.025;
  const bufferPerPcs = Math.round(cogmPerPcs * bufferRate);
  const bufferAllQty = bufferPerPcs * targetQty;

  // HPP / COGS
  const explicitHpp = Number(item.hpp ?? item.HPP ?? item.hppPerPcs ?? 0);
  const hppPerPcs = explicitHpp > 0 ? explicitHpp : (cogmPerPcs > 0 ? cogmPerPcs + bufferPerPcs : 0);
  const hppAllQty = hppPerPcs * targetQty;

  // PPN (11%)
  const explicitPpn = Number(item.taxPrice ?? item.TaxPrice ?? item.ppn ?? item.ppnPerPcs ?? 0);
  const ppnRate = item.ppnRate !== undefined ? Number(item.ppnRate) : 0.11;
  const ppnPerPcs = explicitPpn > 0 ? explicitPpn : Math.round(hppPerPcs * ppnRate);
  const ppnAllQty = ppnPerPcs * targetQty;
  const hppWithPpn = hppPerPcs + ppnPerPcs;

  // Target Selling Price & Margin
  const targetMarkupRate = item.markupRate || 0.30;
  const targetSellingPricePerPcs = Math.round(hppPerPcs / (1 - targetMarkupRate));
  const targetGrossProfitPerPcs = targetSellingPricePerPcs - hppPerPcs;
  const totalRevenueAllQty = targetSellingPricePerPcs * targetQty;
  const totalProfitAllQty = targetGrossProfitPerPcs * targetQty;

  return {
    ...item,
    targetQty,
    fabrics,
    accessories,
    services,
    image,
    primaryFabric,
    mainFabricConsumption,
    mainFabricUnitPrice,
    mainFabricUnit,
    totalConsumption,
    totalKainPerPcs: fabricCostPerPcs,
    cmtCostPerPcs: jasaCostPerPcs,
    accessoriesCostPerPcs: accCostPerPcs,
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
    ppnRate,
    ppnPerPcs,
    ppnAllQty,
    hppWithPpn,
    targetMarkupRate,
    targetSellingPricePerPcs,
    targetGrossProfitPerPcs,
    totalRevenueAllQty,
    totalProfitAllQty,
    // Direct cost aliases
    consm: mainFabricConsumption,
    fabricPrice: mainFabricUnitPrice,
    totalFabric: totalFabricCostAllQty,
    cmtPrice: jasaCostPerPcs,
    accPrice: accCostPerPcs,
    hpp: hppPerPcs,
    taxPrice: ppnPerPcs,
    status,
    Status: status,
    sync_status,
    syncStatus: sync_status,
  };
};

export const rawPrecostingData = [];

export const getInitialPrecostings = () => [];
