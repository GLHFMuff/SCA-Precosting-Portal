// Precosting calculation utilities & empty initial store (no dummy data)

export const garmentImageMap = {
  'PC-2026-001': '/images/shirt.jpg',
  'PC-2026-002': '/images/blouse.jpg',
  'PC-2026-003': '/images/hoodie.jpg',
  'PC-2026-004': '/images/chino.jpg',
  'PC-2026-005': '/images/polo.jpg',
  'PC-2026-006': '/images/jacket.jpg',
};

export const calculatePrecostingTotals = (item) => {
  if (!item) return item;

  // Image resolution (Base64 from database or fallback)
  const image = item.image || item.ProductImage || garmentImageMap[item.precostingNo] || '';

  const fabrics = Array.isArray(item.fabrics) ? item.fabrics : [];
  const accessories = Array.isArray(item.accessories) ? item.accessories : [];
  const services = Array.isArray(item.services) ? item.services : [];

  // Fabric totals
  const fabricCostPerPcs = Number(item.hargaFabric !== undefined && item.hargaFabric !== null && item.totalKain ? item.totalKain : null) ?? fabrics.reduce(
    (acc, f) => acc + (Number(f.consumption) || 0) * (Number(f.unitPrice) || 0),
    0
  );
  const totalFabricCostAllQty = fabricCostPerPcs * (Number(item.targetQty) || 0);

  // Primary fabric info
  const primaryFabric = fabrics.length > 0 ? fabrics[0] : null;
  const mainFabricConsumption = primaryFabric ? Number(primaryFabric.consumption) || 0 : Number(item.consm || 0);
  const mainFabricUnitPrice = primaryFabric ? Number(primaryFabric.unitPrice) || 0 : Number(item.hargaFabric || 0);
  const mainFabricUnit = primaryFabric?.unit || 'Meter';
  const totalConsumption = fabrics.length > 0
    ? Number(fabrics.reduce((sum, f) => sum + (Number(f.consumption) || 0), 0).toFixed(2))
    : mainFabricConsumption;

  // Accessories totals
  const accCostPerPcs = Number(item.hargaAccessories !== undefined && item.hargaAccessories !== null && item.hargaAccessories > 0 ? item.hargaAccessories : null) ?? accessories.reduce(
    (acc, a) => acc + (Number(a.qtyPerPcs) || 0) * (Number(a.unitPrice) || 0),
    0
  );
  const totalAccCostAllQty = accCostPerPcs * (Number(item.targetQty) || 0);

  // Jasa totals (CMT)
  const jasaCostPerPcs = Number(item.hargaCmt !== undefined && item.hargaCmt !== null && item.hargaCmt > 0 ? item.hargaCmt : null) ?? services.reduce(
    (acc, s) => acc + (Number(s.unitPrice) || 0),
    0
  );
  const totalJasaCostAllQty = jasaCostPerPcs * (Number(item.targetQty) || 0);

  // Direct Material = Fabric + Accessories
  const directMaterialPerPcs = fabricCostPerPcs + accCostPerPcs;
  const directMaterialAllQty = directMaterialPerPcs * (Number(item.targetQty) || 0);

  // Direct Labor
  const directLaborPerPcs = services
    .filter((s) => s.category === 'Direct Labor')
    .reduce((acc, s) => acc + (Number(s.unitPrice) || 0), 0);
  const directLaborAllQty = directLaborPerPcs * (Number(item.targetQty) || 0);

  // Factory Overhead
  const factoryOverheadPerPcs = services
    .filter((s) => s.category !== 'Direct Labor')
    .reduce((acc, s) => acc + (Number(s.unitPrice) || 0), 0);
  const factoryOverheadAllQty = factoryOverheadPerPcs * (Number(item.targetQty) || 0);

  // COGM (Cost of Goods Manufactured / Biaya Pokok Produksi)
  const cogmPerPcs = fabricCostPerPcs + accCostPerPcs + jasaCostPerPcs;
  const cogmAllQty = cogmPerPcs * (Number(item.targetQty) || 0);

  // Operational buffer
  const bufferRate = item.bufferRate !== undefined ? item.bufferRate : 0.025;
  const bufferPerPcs = Math.round(cogmPerPcs * bufferRate);
  const bufferAllQty = bufferPerPcs * (Number(item.targetQty) || 0);

  // HPP / COGS (Harga Pokok Penjualan)
  const hppPerPcs = Number(item.hpp) || (cogmPerPcs + bufferPerPcs);
  const hppAllQty = hppPerPcs * (Number(item.targetQty) || 0);

  // PPN (11%)
  const ppnRate = item.ppnRate !== undefined ? item.ppnRate : 0.11;
  const ppnPerPcs = Number(item.ppn) || Math.round(hppPerPcs * ppnRate);
  const ppnAllQty = ppnPerPcs * (Number(item.targetQty) || 0);
  const hppWithPpn = hppPerPcs + ppnPerPcs;

  // Target Selling Price & Margin
  const targetMarkupRate = item.markupRate || 0.30;
  const targetSellingPricePerPcs = Math.round(hppPerPcs / (1 - targetMarkupRate));
  const targetGrossProfitPerPcs = targetSellingPricePerPcs - hppPerPcs;
  const totalRevenueAllQty = targetSellingPricePerPcs * (Number(item.targetQty) || 0);
  const totalProfitAllQty = targetGrossProfitPerPcs * (Number(item.targetQty) || 0);

  return {
    ...item,
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
  };
};

export const rawPrecostingData = [];

export const getInitialPrecostings = () => [];
