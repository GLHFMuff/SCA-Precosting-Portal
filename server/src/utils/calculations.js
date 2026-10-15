// Garment Financial Costing Calculation Engine for Precosting Portal

export const calculatePrecostingTotals = (item) => {
  const fabrics = Array.isArray(item.fabrics) ? item.fabrics : [];
  const accessories = Array.isArray(item.accessories) ? item.accessories : [];
  const services = Array.isArray(item.services) ? item.services : [];
  const targetQty = Number(item.targetQty) || 0;

  // 1. Fabric totals
  const fabricCostPerPcs = fabrics.reduce(
    (acc, f) => acc + (Number(f.consumption) || 0) * (Number(f.unitPrice) || 0),
    0
  );
  const totalFabricCostAllQty = fabricCostPerPcs * targetQty;

  const primaryFabric = fabrics.length > 0 ? fabrics[0] : null;
  const mainFabricConsumption = primaryFabric ? Number(primaryFabric.consumption) || 0 : 0;
  const mainFabricUnitPrice = primaryFabric ? Number(primaryFabric.unitPrice) || 0 : 0;
  const mainFabricUnit = primaryFabric?.unit || 'Meter';
  const totalConsumption = Number(
    fabrics.reduce((sum, f) => sum + (Number(f.consumption) || 0), 0).toFixed(2)
  );

  // 2. Accessories totals
  const accCostPerPcs = accessories.reduce(
    (acc, a) => acc + (Number(a.qtyPerPcs) || 0) * (Number(a.unitPrice) || 0),
    0
  );
  const totalAccCostAllQty = accCostPerPcs * targetQty;

  // 3. Jasa totals (CMT)
  const jasaCostPerPcs = services.reduce(
    (acc, s) => acc + (Number(s.unitPrice) || 0),
    0
  );
  const totalJasaCostAllQty = jasaCostPerPcs * targetQty;

  // 4. Direct Material = Fabric + Accessories
  const directMaterialPerPcs = fabricCostPerPcs + accCostPerPcs;
  const directMaterialAllQty = directMaterialPerPcs * targetQty;

  // 5. Direct Labor (Sewing, Cutting, Buttoning)
  const directLaborPerPcs = services
    .filter((s) => s.category === 'Direct Labor')
    .reduce((acc, s) => acc + (Number(s.unitPrice) || 0), 0);
  const directLaborAllQty = directLaborPerPcs * targetQty;

  // 6. Factory Overhead (Marker, Sablon, Finishing, QC, Packing)
  const factoryOverheadPerPcs = services
    .filter((s) => s.category !== 'Direct Labor')
    .reduce((acc, s) => acc + (Number(s.unitPrice) || 0), 0);
  const factoryOverheadAllQty = factoryOverheadPerPcs * targetQty;

  // 7. COGM (Cost of Goods Manufactured) = Fabric + Acc + Jasa
  const cogmPerPcs = fabricCostPerPcs + accCostPerPcs + jasaCostPerPcs;
  const cogmAllQty = cogmPerPcs * targetQty;

  // 8. Buffer penyusutan kain & handling (default 2.5%)
  const bufferRate = item.bufferRate !== undefined ? Number(item.bufferRate) : 0.025;
  const bufferPerPcs = Math.round(cogmPerPcs * bufferRate);
  const bufferAllQty = bufferPerPcs * targetQty;

  // 9. HPP / COGS (Harga Pokok Penjualan)
  const hppPerPcs = cogmPerPcs + bufferPerPcs;
  const hppAllQty = hppPerPcs * targetQty;

  // 10. PPN (Pajak Pertambahan Nilai 11%)
  const ppnRate = item.ppnRate !== undefined ? Number(item.ppnRate) : 0.11;
  const ppnPerPcs = Math.round(hppPerPcs * ppnRate);
  const ppnAllQty = ppnPerPcs * targetQty;
  const hppWithPpn = hppPerPcs + ppnPerPcs;

  // 11. Target Selling Price & Margin estimation (Default 30% markup)
  const targetMarkupRate = item.markupRate !== undefined ? Number(item.markupRate) : 0.30;
  const targetSellingPricePerPcs = Math.round(hppPerPcs / (1 - targetMarkupRate));
  const targetGrossProfitPerPcs = targetSellingPricePerPcs - hppPerPcs;
  const totalRevenueAllQty = targetSellingPricePerPcs * targetQty;
  const totalProfitAllQty = targetGrossProfitPerPcs * targetQty;

  return {
    ...item,
    targetQty,
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
