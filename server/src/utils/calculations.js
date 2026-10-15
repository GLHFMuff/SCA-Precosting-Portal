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

  // 1. Fabric totals
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

  // Auto-generate services if direct cmtPrice supplied
  const cmtPriceInput = Number(
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
    if (cmtPriceInput > 500000 && targetQty > 1) {
      jasaCostPerPcs = Math.round(cmtPriceInput / targetQty);
    } else {
      jasaCostPerPcs = cmtPriceInput;
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

  // Auto-generate accessories if direct accPrice supplied
  const accPriceInput = Number(
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
    if (accPriceInput > 50000 && targetQty > 1 && (item.hpp ? accPriceInput > Number(item.hpp) : true)) {
      accCostPerPcs = Math.round(accPriceInput / targetQty);
    } else {
      accCostPerPcs = accPriceInput;
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
  const hppPerPcs = explicitHpp > 0 ? explicitHpp : (cogmPerPcs > 0 ? (cogmPerPcs + bufferPerPcs) : 0);
  const hppAllQty = hppPerPcs * targetQty;

  // 10. PPN (Pajak Pertambahan Nilai 11%)
  const explicitPpn = Number(item.taxPrice || item.TaxPrice || item.ppn || item.ppnPerPcs || 0);
  const ppnRate = item.ppnRate !== undefined ? Number(item.ppnRate) : 0.11;
  const ppnPerPcs = explicitPpn > 0 ? explicitPpn : Math.round(hppPerPcs * ppnRate);
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
    // Direct cost aliases
    consm: mainFabricConsumption,
    fabricPrice: mainFabricUnitPrice,
    totalFabric: totalFabricCostAllQty,
    cmtPrice: jasaCostPerPcs,
    accPrice: accCostPerPcs,
    hpp: hppPerPcs,
    taxPrice: ppnPerPcs,
  };
};
