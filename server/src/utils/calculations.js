// Garment Financial Costing Calculation Engine for Precosting Portal

export const calculatePrecostingTotals = (item) => {
  let fabrics = Array.isArray(item.fabrics) ? item.fabrics : [];
  let accessories = Array.isArray(item.accessories) ? item.accessories : [];
  let services = Array.isArray(item.services) ? item.services : [];
  const targetQty = Number(item.targetQty) || 1000;

  // Support direct field inputs from SQL or flat payloads
  const consmInput = Number(
    item.consm ??
    item.Consume ??
    item.consume ??
    item.mainFabricConsumption ??
    0
  );
  const fabricPriceInput = Number(
    item.fabricPrice ??
    item.FabricPrice ??
    item.hargaFabric ??
    item.harga_fabric ??
    item.mainFabricUnitPrice ??
    item.savedHargaFabric ??
    0
  );
  const totalFabricInput = Number(
    item.totalFabric ??
    item.TotalFabricPrice ??
    item.totalKain ??
    item.total_kain ??
    (consmInput > 0 && fabricPriceInput > 0 ? consmInput * fabricPriceInput : 0)
  );

  if (fabrics.length === 0 && (consmInput > 0 || fabricPriceInput > 0 || totalFabricInput > 0)) {
    const resolvedUnitPrice = fabricPriceInput > 0
      ? fabricPriceInput
      : (consmInput > 0 && totalFabricInput > 0 ? totalFabricInput / consmInput : totalFabricInput);

    fabrics = [
      {
        id: `f-${Date.now()}-1`,
        name: item.fabricName || 'Main Fabric',
        spec: item.fabricSpec || 'Standard Fabric Spec',
        part: 'Body',
        consumption: consmInput || 1,
        unit: item.fabricUnit || 'Meter',
        unitPrice: resolvedUnitPrice,
      },
    ];
  }

  // 1. Fabric totals
  let fabricCostPerPcs = fabrics.reduce(
    (acc, f) => acc + (Number(f.consumption) || 0) * (Number(f.unitPrice) || 0),
    0
  );
  if (fabricCostPerPcs === 0 && totalFabricInput > 0) {
    fabricCostPerPcs = totalFabricInput;
  }
  const totalFabricCostAllQty = fabricCostPerPcs * targetQty;

  const primaryFabric = fabrics.length > 0 ? fabrics[0] : null;
  const mainFabricConsumption = primaryFabric ? Number(primaryFabric.consumption) || 0 : consmInput;
  const mainFabricUnitPrice = primaryFabric ? Number(primaryFabric.unitPrice) || 0 : fabricPriceInput;
  const mainFabricUnit = primaryFabric?.unit || 'Meter';
  const totalConsumption = Number(
    fabrics.reduce((sum, f) => sum + (Number(f.consumption) || 0), 0).toFixed(2)
  ) || consmInput;

  // Auto-generate accessories if direct accPrice supplied
  const accPriceInput = Number(item.accPrice || item.AccPrice || item.hargaAccessories || 0);
  if (accessories.length === 0 && accPriceInput > 0) {
    accessories = [
      {
        id: `a-${Date.now()}-1`,
        name: 'Trims & Accessories Package',
        spec: 'Complete package per pcs',
        qtyPerPcs: 1,
        unit: 'Set',
        unitPrice: accPriceInput,
      },
    ];
  }

  // 2. Accessories totals
  let accCostPerPcs = accessories.reduce(
    (acc, a) => acc + (Number(a.qtyPerPcs) || 0) * (Number(a.unitPrice) || 0),
    0
  );
  if (accCostPerPcs === 0 && accPriceInput > 0) {
    accCostPerPcs = accPriceInput;
  }
  const totalAccCostAllQty = accCostPerPcs * targetQty;

  // Auto-generate services if direct cmtPrice supplied
  const cmtPriceInput = Number(item.cmtPrice || item.CMTPrice || item.hargaCmt || 0);
  if (services.length === 0 && cmtPriceInput > 0) {
    services = [
      {
        id: `s-${Date.now()}-1`,
        name: 'CMT Service (Cutting, Making, Trimming)',
        category: 'Direct Labor',
        description: 'Total jasa CMT per pcs',
        unitPrice: cmtPriceInput,
      },
    ];
  }

  // 3. Jasa totals (CMT)
  let jasaCostPerPcs = services.reduce(
    (acc, s) => acc + (Number(s.unitPrice) || 0),
    0
  );
  if (jasaCostPerPcs === 0 && cmtPriceInput > 0) {
    jasaCostPerPcs = cmtPriceInput;
  }
  const totalJasaCostAllQty = jasaCostPerPcs * targetQty;

  // 4. Direct Material = Fabric + Accessories
  const directMaterialPerPcs = fabricCostPerPcs + accCostPerPcs;
  const directMaterialAllQty = directMaterialPerPcs * targetQty;

  // 5. Direct Labor (Sewing, Cutting, Buttoning)
  const directLaborPerPcs = services
    .filter((s) => s.category === 'Direct Labor')
    .reduce((acc, s) => acc + (Number(s.unitPrice) || 0), 0) || jasaCostPerPcs;
  const directLaborAllQty = directLaborPerPcs * targetQty;

  // 6. Factory Overhead
  const factoryOverheadPerPcs = services
    .filter((s) => s.category !== 'Direct Labor')
    .reduce((acc, s) => acc + (Number(s.unitPrice) || 0), 0);
  const factoryOverheadAllQty = factoryOverheadPerPcs * targetQty;

  // 7. COGM (Cost of Goods Manufactured) = Fabric + Acc + Jasa
  const calculatedCogm = fabricCostPerPcs + accCostPerPcs + jasaCostPerPcs;
  const cogmPerPcs = calculatedCogm > 0 ? calculatedCogm : (Number(item.cogmPerPcs) || 0);
  const cogmAllQty = cogmPerPcs * targetQty;

  // 8. Buffer penyusutan kain & handling (default 2.5%)
  const bufferRate = item.bufferRate !== undefined ? Number(item.bufferRate) : 0.025;
  const bufferPerPcs = Math.round(cogmPerPcs * bufferRate);
  const bufferAllQty = bufferPerPcs * targetQty;

  // 9. HPP / COGS (Harga Pokok Penjualan)
  const explicitHpp = Number(item.hpp || item.HPP || item.hppPerPcs || 0);
  const hppPerPcs = (cogmPerPcs > 0 ? (cogmPerPcs + bufferPerPcs) : explicitHpp) || explicitHpp;
  const hppAllQty = hppPerPcs * targetQty;

  // 10. PPN (Pajak Pertambahan Nilai 11%)
  const explicitPpn = Number(item.taxPrice || item.TaxPrice || item.ppn || item.ppnPerPcs || 0);
  const ppnRate = item.ppnRate !== undefined ? Number(item.ppnRate) : 0.11;
  const ppnPerPcs = (hppPerPcs > 0 ? Math.round(hppPerPcs * ppnRate) : explicitPpn) || explicitPpn;
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
