import React, { useState } from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { formatRupiah, formatNumber, formatDate } from '../../utils/formatters';
import { decodeBase64Image } from '../../utils/imageUtils';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Coins,
  Shirt,
  DollarSign,
  Tag,
  Info,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Package,
  Scissors,
  Layers
} from 'lucide-react';

const formatPercent = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0,0%';
  return Number(val).toFixed(1).replace('.', ',') + '%';
};

const formatDecimal = (val, decimals = 2) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
};

const checkIsOverdue = (dateString) => {
  if (!dateString) return false;
  try {
    const d = new Date(dateString);
    return !isNaN(d.getTime()) && d.getTime() < Date.now();
  } catch {
    return false;
  }
};

export const PrecostingDetail = () => {
  const {
    selectedPrecosting,
    clearSelectedPrecosting,
    setApprovalModalItem,
    setRejectModalItem,
    addRemark,
    user
  } = usePrecosting();

  const [newRemarkText, setNewRemarkText] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showFullSpecs, setShowFullSpecs] = useState(false);

  if (!selectedPrecosting) return null;

  const item = selectedPrecosting;
  const remarks = item.remarks || [];

  const handleAddRemarkSubmit = (e) => {
    e.preventDefault();
    if (!newRemarkText.trim()) return;
    addRemark(item.id, newRemarkText);
    setNewRemarkText('');
  };

  const handlePrint = () => {
    window.print();
  };

  // 1. Data Normalization & Core Financial Variables
  const targetQty = Number(item.targetQty || item.ProdQty || 1000);
  const styleName = item.itemName || item.ProdName || 'Style Garment';

  // Fabric cost normalization
  const rawFabricCost = Number(item.fabricCostPerPcs ?? item.totalKainPerPcs ?? item.totalKain ?? item.totalFabric ?? 0);
  const normalizedFabricCost = rawFabricCost > 100000 && targetQty > 1 ? Math.round(rawFabricCost / targetQty) : rawFabricCost;

  // Accessories cost normalization
  const rawAccCost = Number(item.accCostPerPcs ?? item.accessoriesCostPerPcs ?? item.accPrice ?? 0);
  const normalizedAccCost = rawAccCost > 50000 && targetQty > 1 && (item.hpp ? rawAccCost > Number(item.hpp) : true) ? Math.round(rawAccCost / targetQty) : rawAccCost;

  // Services/CMT cost normalization
  const rawJasaCost = Number(item.jasaCostPerPcs ?? item.cmtCostPerPcs ?? item.cmtPrice ?? 0);
  const normalizedJasaCost = rawJasaCost > 500000 && targetQty > 1 ? Math.round(rawJasaCost / targetQty) : rawJasaCost;

  // Base sum of direct elements
  const baseDirectSum = normalizedFabricCost + normalizedAccCost + normalizedJasaCost;
  const explicitHpp = Number(item.hppPerPcs ?? item.hpp ?? item.HPP ?? 0);
  const hppVal = explicitHpp > 0 ? explicitHpp : (baseDirectSum > 0 ? baseDirectSum : 148217);

  // Overhead / Lain-lain
  const otherCost = (hppVal > baseDirectSum)
    ? (hppVal - baseDirectSum)
    : Number(item.bufferPerPcs || item.factoryOverheadPerPcs || 0);

  // Total Production Cost (Biaya Produksi)
  const totalProductionCost = hppVal * targetQty;

  // Selling Price (Harga Jual) & Multiplier
  const explicitSellingPrice = Number(
    item.sellingPrice ||
    item.targetSellingPricePerPcs ||
    item.HargaJual ||
    item.hargaJual ||
    0
  );
  // Default markup multiplier ~6x if unstated or using target markup rate
  const sellingPrice = explicitSellingPrice > 0
    ? explicitSellingPrice
    : (hppVal > 0 ? Math.round(hppVal * (item.markupRate ? (1 + Number(item.markupRate)) : 6)) : 889302);
  const multiplier = hppVal > 0 ? Math.round(sellingPrice / hppVal) : 6;

  // Percentage Calculations for Cost Composition
  const effectiveTotal = (normalizedFabricCost + normalizedAccCost + normalizedJasaCost + otherCost) || hppVal || 1;
  const fabricPct = Number(((normalizedFabricCost / effectiveTotal) * 100).toFixed(1));
  const accPct = Number(((normalizedAccCost / effectiveTotal) * 100).toFixed(1));
  const cmtPct = Number(((normalizedJasaCost / effectiveTotal) * 100).toFixed(1));
  const otherPct = Number((Math.max(0, 100 - (fabricPct + accPct + cmtPct))).toFixed(1));

  // Delivery status calculation
  const isDeliveryOverdue = checkIsOverdue(item.deliveryDate);
  const deliveryDateDisplay = formatDate(item.deliveryDate);

  // Approval status check
  const statusStr = (item.status || item.Status || '').toLowerCase().trim();
  const isConfirmed = statusStr === 'confirmed' || statusStr === 'approved' || statusStr === 'confirm';
  const isRejected = statusStr === 'rejected' || statusStr === 'reject' || statusStr === 'revision';
  const isPending = !isConfirmed && !isRejected;

  // Colors breakdown
  const colorsData = Array.isArray(item.colors) && item.colors.length > 0
    ? item.colors
    : [
        { name: 'Warna 1', qty: Math.ceil(targetQty / 2), colorClass: 'disc-purple' },
        { name: 'Warna 2', qty: Math.floor(targetQty / 2), colorClass: 'disc-beige' }
      ];

  // Fabric list for Box 4 (Kebutuhan Bahan)
  const fabricsList = (Array.isArray(item.fabrics) && item.fabrics.length > 0)
    ? item.fabrics
    : [
        { name: 'Chiffon Jacquard', consumption: 1.52 },
        { name: 'SJ-9028-D', consumption: 1.52 },
        { name: 'Errow', consumption: 1.42 }
      ];
  const totalFabricMeters = fabricsList.reduce(
    (sum, f) => sum + (Number(f.consumption) || 0) * targetQty,
    0
  );

  // Accessories list for Box 6 (BOM Aksesoris)
  const defaultAccessoriesList = [
    { name: 'Kancing', qtyPerPcs: 4, unit: 'pcs' },
    { name: 'Rivet', qtyPerPcs: 2, unit: 'pcs' },
    { name: 'Label', qtyPerPcs: 1, unit: 'pcs' },
    { name: 'Benang', qtyPerPcs: 1, unit: 'pcs' },
    { name: 'Kemasan', qtyPerPcs: 1, unit: 'pcs' }
  ];
  const accessoriesList = (Array.isArray(item.accessories) && item.accessories.length > 0)
    ? item.accessories
    : defaultAccessoriesList;

  // SVG Donut Chart Slices
  const donutSlices = [
    { name: 'Biaya kain', pct: fabricPct, color: '#0284c7' },
    { name: 'Biaya aksesoris', pct: accPct, color: '#f97316' },
    { name: 'Biaya jasa CMT', pct: cmtPct, color: '#10b981' },
    { name: 'Biaya lain-lain', pct: otherPct, color: '#8b5cf6' },
  ];

  const donutRadius = 65;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedLength = 0;

  return (
    <div className="costing-detail-page">
      {/* TOP NAVIGATION & ACTION BAR */}
      <div className="costing-top-nav no-print">
        <button
          type="button"
          className="btn-back-grid"
          onClick={clearSelectedPrecosting}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Grid Precosting</span>
        </button>

        <div className="detail-action-buttons">
          <button
            type="button"
            className="btn-detail-action btn-print"
            onClick={handlePrint}
            title="Cetak Analisis Costing"
          >
            <Printer size={15} />
            <span>Cetak / PDF</span>
          </button>

          {isPending && (
            <>
              <button
                type="button"
                className="btn-detail-action btn-detail-approve"
                onClick={() => setApprovalModalItem(item)}
              >
                <CheckCircle size={15} />
                <span>Approve Precosting</span>
              </button>

              <button
                type="button"
                className="btn-detail-action btn-detail-reject"
                onClick={() => setRejectModalItem(item)}
              >
                <XCircle size={15} />
                <span>Reject Precosting</span>
              </button>
            </>
          )}

          {isConfirmed && (
            <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} /> Confirmed (Disetujui)
            </span>
          )}

          {isRejected && (
            <span className="badge badge-danger" style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <XCircle size={14} /> Rejected (Ditolak)
            </span>
          )}
        </div>
      </div>

      {/* HERO BANNER */}
      <div className="costing-hero-banner">
        {/* Left Style & Title Info */}
        <div className="hero-left-info">
          <div className="hero-subtitle-tag">Analisis Costing & Sewing Order</div>
          <div className="hero-style-name">{styleName}</div>
          <div className="hero-description">
            Perhitungan biaya produksi, kebutuhan bahan, dan estimasi profit
          </div>
        </div>

        {/* Right Floating Badge Cards */}
        <div className="hero-right-cards">
          {/* Tanggal Delivery Pill */}
          <div className="hero-white-card">
            <div className="hero-calendar-icon-box">
              <Calendar size={18} />
            </div>
            <div className="hero-card-col">
              <span className="card-label">Tanggal Delivery</span>
              <span className="card-main-val">{deliveryDateDisplay}</span>
              <span className={`card-status-badge ${isDeliveryOverdue ? 'status-overdue' : 'status-ontime'}`}>
                {isDeliveryOverdue ? '(Sudah lewat)' : '(Tepat waktu)'}
              </span>
            </div>
          </div>

          {/* Garment Thumbnail Card */}
          <div className="hero-garment-thumb-card">
            <div
              className="hero-thumb-wrapper"
              onClick={() => setIsImageModalOpen(true)}
              title="Klik untuk memperbesar foto garmen"
            >
              <img
                src={decodeBase64Image(item.image)}
                alt={styleName}
                className="hero-thumb-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/shirt.jpg';
                }}
              />
            </div>
            <div className="hero-thumb-specs">
              <div className="spec-row">
                <span>Style</span>
                <span>:</span>
                <strong>{styleName}</strong>
              </div>
              <div className="spec-row">
                <span>Qty</span>
                <span>:</span>
                <strong>{formatNumber(targetQty)} pcs</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP 4 KPI CARDS */}
      <div className="costing-kpi-row">
        {/* Card 1: HPP per pcs */}
        <div className="costing-kpi-card kpi-card-cyan">
          <div className="kpi-top-row">
            <div className="kpi-circle-icon kpi-icon-cyan">
              <Coins size={22} />
            </div>
            <div className="kpi-meta-text">
              <span className="kpi-card-title">HPP per pcs</span>
              <span className="kpi-card-value font-mono">{formatRupiah(hppVal)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Qty Produksi */}
        <div className="costing-kpi-card kpi-card-green">
          <div className="kpi-top-row">
            <div className="kpi-circle-icon kpi-icon-green">
              <Shirt size={22} />
            </div>
            <div className="kpi-meta-text">
              <span className="kpi-card-title">Qty Produksi</span>
              <span className="kpi-card-value font-mono">{formatNumber(targetQty)} pcs</span>
              <span className="kpi-card-subtext">
                ({colorsData.length} warna × {formatNumber(colorsData[0]?.qty || Math.round(targetQty / 2))} pcs)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Biaya Produksi */}
        <div className="costing-kpi-card kpi-card-purple">
          <div className="kpi-top-row">
            <div className="kpi-circle-icon kpi-icon-purple">
              <DollarSign size={22} />
            </div>
            <div className="kpi-meta-text">
              <span className="kpi-card-title">Total Biaya Produksi</span>
              <span className="kpi-card-value font-mono">{formatRupiah(totalProductionCost)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Harga Jual (di sheet) */}
        <div className="costing-kpi-card kpi-card-orange">
          <div>
            <div className="kpi-top-row">
              <div className="kpi-circle-icon kpi-icon-orange">
                <Tag size={22} />
              </div>
              <div className="kpi-meta-text">
                <span className="kpi-card-title">Harga Jual (di sheet)</span>
                <span className="kpi-card-value font-mono">{formatRupiah(sellingPrice)}</span>
                <span className="kpi-card-subtext">(per pcs)</span>
              </div>
            </div>
            <div className="kpi-warning-box">
              <AlertTriangle size={14} className="kpi-warning-icon" />
              <span>Perlu konfirmasi apakah angka {multiplier} adalah pengali harga jual yang benar.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 1: 3-COLUMN COST COMPOSITION */}
      <div className="costing-3col-grid">
        {/* Box 1: Komposisi HPP (per pcs) */}
        <div className="costing-box">
          <div className="costing-box-header">1. Komposisi HPP (per pcs)</div>
          <div className="costing-box-body">
            <div className="donut-flex-container">
              {/* SVG Donut Chart */}
              <div className="donut-chart-wrapper">
                <svg viewBox="0 0 180 180" width="100%" height="100%">
                  <g transform="rotate(-90 90 90)">
                    {donutSlices.map((slice, i) => {
                      const dashLength = (slice.pct / 100) * donutCircumference;
                      const offset = -accumulatedLength;
                      accumulatedLength += dashLength;

                      return (
                        <circle
                          key={i}
                          cx="90"
                          cy="90"
                          r={donutRadius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="26"
                          strokeDasharray={`${dashLength} ${donutCircumference}`}
                          strokeDashoffset={offset}
                        />
                      );
                    })}
                  </g>

                  {/* Percentage text labels calculated on arc centers */}
                  {(() => {
                    let arcOffset = 0;
                    return donutSlices.map((slice, i) => {
                      const sliceAngle = (slice.pct / 100) * 360;
                      const midAngle = arcOffset + sliceAngle / 2;
                      arcOffset += sliceAngle;

                      if (slice.pct < 6) return null;

                      const rad = (midAngle - 90) * (Math.PI / 180);
                      const tx = 90 + donutRadius * Math.cos(rad);
                      const ty = 90 + donutRadius * Math.sin(rad);

                      return (
                        <text
                          key={i}
                          x={tx}
                          y={ty}
                          fill="#ffffff"
                          fontSize="9.5"
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {formatPercent(slice.pct)}
                        </text>
                      );
                    });
                  })()}

                  {/* Center Hole Info */}
                  <text x="90" y="76" textAnchor="middle" fill="#64748b" fontSize="9.5" fontWeight="600">
                    Total HPP
                  </text>
                  <text x="90" y="94" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="800" fontFamily="monospace">
                    {formatRupiah(hppVal)}
                  </text>
                  <text x="90" y="109" textAnchor="middle" fill="#64748b" fontSize="8.5">
                    per pcs
                  </text>
                </svg>
              </div>

              {/* Table breakdown next to donut */}
              <div className="donut-legend-table">
                <table className="costing-table">
                  <thead>
                    <tr>
                      <th>Komponen</th>
                      <th className="td-right">Biaya (Rp)</th>
                      <th className="td-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="donut-dot dot-blue" />Biaya kain</td>
                      <td className="td-right font-mono">{formatRupiah(normalizedFabricCost)}</td>
                      <td className="td-right font-mono">{formatPercent(fabricPct)}</td>
                    </tr>
                    <tr>
                      <td><span className="donut-dot dot-orange" />Biaya aksesoris</td>
                      <td className="td-right font-mono">{formatRupiah(normalizedAccCost)}</td>
                      <td className="td-right font-mono">{formatPercent(accPct)}</td>
                    </tr>
                    <tr>
                      <td><span className="donut-dot dot-green" />Biaya jasa CMT</td>
                      <td className="td-right font-mono">{formatRupiah(normalizedJasaCost)}</td>
                      <td className="td-right font-mono">{formatPercent(cmtPct)}</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="donut-dot dot-purple" />
                        Biaya lain-lain <span className="text-muted" style={{ fontSize: '0.65rem' }}>(operasional, transport, dll)</span>
                      </td>
                      <td className="td-right font-mono">{formatRupiah(otherCost)}</td>
                      <td className="td-right font-mono">{formatPercent(otherPct)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total HPP per pcs</strong></td>
                      <td className="td-right font-mono font-bold">{formatRupiah(hppVal)}</td>
                      <td className="td-right font-mono font-bold">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Rincian Biaya per Komponen */}
        <div className="costing-box">
          <div className="costing-box-header">2. Rincian Biaya per Komponen</div>
          <div className="costing-box-body">
            <table className="costing-table" style={{ height: '100%' }}>
              <thead>
                <tr>
                  <th>Komponen</th>
                  <th className="td-right">Biaya (Rp)</th>
                  <th className="td-right">%</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Biaya kain</td>
                  <td className="td-right font-mono">{formatRupiah(normalizedFabricCost)}</td>
                  <td className="td-right font-mono">{formatPercent(fabricPct)}</td>
                </tr>
                <tr>
                  <td>Biaya aksesoris</td>
                  <td className="td-right font-mono">{formatRupiah(normalizedAccCost)}</td>
                  <td className="td-right font-mono">{formatPercent(accPct)}</td>
                </tr>
                <tr>
                  <td>Jasa CMT</td>
                  <td className="td-right font-mono">{formatRupiah(normalizedJasaCost)}</td>
                  <td className="td-right font-mono">{formatPercent(cmtPct)}</td>
                </tr>
                <tr>
                  <td>Biaya lain-lain</td>
                  <td className="td-right font-mono">{formatRupiah(otherCost)}</td>
                  <td className="td-right font-mono">{formatPercent(otherPct)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total HPP per pcs</strong></td>
                  <td className="td-right font-mono font-bold">{formatRupiah(hppVal)}</td>
                  <td className="td-right font-mono font-bold">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Box 3: Visual Komposisi Biaya */}
        <div className="costing-box">
          <div className="costing-box-header">3. Visual Komposisi Biaya</div>
          <div className="costing-box-body">
            <div className="visual-progress-list">
              <div className="visual-progress-item">
                <span className="progress-label">Kain</span>
                <div className="progress-track">
                  <div className="progress-fill fill-blue" style={{ width: `${fabricPct}%` }} />
                </div>
                <span className="progress-pct-val font-mono">{formatPercent(fabricPct)}</span>
              </div>

              <div className="visual-progress-item">
                <span className="progress-label">Aksesori</span>
                <div className="progress-track">
                  <div className="progress-fill fill-orange" style={{ width: `${accPct}%` }} />
                </div>
                <span className="progress-pct-val font-mono">{formatPercent(accPct)}</span>
              </div>

              <div className="visual-progress-item">
                <span className="progress-label">CMT</span>
                <div className="progress-track">
                  <div className="progress-fill fill-green" style={{ width: `${cmtPct}%` }} />
                </div>
                <span className="progress-pct-val font-mono">{formatPercent(cmtPct)}</span>
              </div>

              <div className="visual-progress-item">
                <span className="progress-label">Lain-lain</span>
                <div className="progress-track">
                  <div className="progress-fill fill-purple" style={{ width: `${otherPct}%` }} />
                </div>
                <span className="progress-pct-val font-mono">{formatPercent(otherPct)}</span>
              </div>
            </div>

            {/* Info callout note */}
            <div className="costing-info-callout">
              <Info size={16} />
              <div>
                Biaya jasa CMT sudah termasuk dalam perhitungan HPP. Pastikan nilai CMT sesuai dengan kontrak jasa produksi.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: 3-COLUMN MATERIALS, COLORS & BOM */}
      <div className="costing-3col-grid">
        {/* Box 4: Kebutuhan Bahan (Total) */}
        <div className="costing-box">
          <div className="costing-box-header">4. Kebutuhan Bahan (Total)</div>
          <div className="costing-box-body">
            <table className="costing-table">
              <thead>
                <tr>
                  <th>Jenis Kain</th>
                  <th className="td-center">Consumption (m/pcs)</th>
                  <th className="td-right">Kebutuhan (m)</th>
                </tr>
              </thead>
              <tbody>
                {fabricsList.map((f, idx) => {
                  const consm = Number(f.consumption) || 0;
                  const neededMeters = consm * targetQty;
                  return (
                    <tr key={f.id || idx}>
                      <td><strong>{f.name}</strong></td>
                      <td className="td-center font-mono">{formatDecimal(consm, 2)}</td>
                      <td className="td-right font-mono font-medium">{formatDecimal(neededMeters, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="tfoot-cyan">
                  <td colSpan="2"><strong>Total seluruh kain</strong></td>
                  <td className="td-right font-mono font-bold">{formatDecimal(totalFabricMeters, 2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Box 5: Pembagian Warna */}
        <div className="costing-box">
          <div className="costing-box-header">5. Pembagian Warna</div>
          <div className="costing-box-body">
            <div className="color-breakdown-wrapper">
              <div className="color-circles-row">
                {colorsData.map((c, idx) => (
                  <div key={idx} className={`color-circle-disc ${c.colorClass || (idx % 2 === 0 ? 'disc-purple' : 'disc-beige')}`}>
                    <span className="color-disc-name">{c.name}</span>
                    <span className="color-disc-qty font-mono">{formatNumber(c.qty)} pcs</span>
                  </div>
                ))}
              </div>

              <div className="total-prod-summary">
                <div className="total-prod-icon-box">
                  <Shirt size={20} />
                </div>
                <div className="total-prod-text">
                  <span className="total-prod-label">Total produksi</span>
                  <span className="total-prod-val font-mono">{formatNumber(targetQty)} pcs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Box 6: BOM Aksesoris (Ringkasan) */}
        <div className="costing-box">
          <div className="costing-box-header">6. BOM Aksesoris (Ringkasan)</div>
          <div className="costing-box-body">
            <table className="costing-table">
              <thead>
                <tr>
                  <th style={{ width: '28px' }} className="td-center">No</th>
                  <th>Jenis Aksesori</th>
                  <th className="td-center">Jumlah per pcs</th>
                  <th className="td-right">Total Kebutuhan (+5% toleransi)</th>
                </tr>
              </thead>
              <tbody>
                {accessoriesList.slice(0, 5).map((a, idx) => {
                  const qty = Number(a.qtyPerPcs) || 1;
                  const totalAcc = Math.ceil(qty * targetQty * 1.05);
                  return (
                    <tr key={a.id || idx}>
                      <td className="td-center font-mono text-muted">{idx + 1}</td>
                      <td><strong>{a.name}</strong></td>
                      <td className="td-center font-mono">{qty} {a.unit || 'pcs'}</td>
                      <td className="td-right font-mono font-medium">{formatNumber(totalAcc)} {a.unit || 'pcs'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROW 3: 3 INSIGHT CARDS */}
      <div className="costing-3col-grid">
        {/* Card 1: Temuan yang Perlu Diperiksa */}
        <div className="insight-card insight-card-alert">
          <div className="insight-header">
            <AlertTriangle size={20} color="#e11d48" />
            <h3 className="insight-title">Temuan yang Perlu Diperiksa</h3>
          </div>
          <div className="insight-list">
            <div className="insight-list-item">
              <span className="insight-num-badge badge-red">1</span>
              <div className="insight-item-content">
                <strong>Harga jual {styleName} perlu dikonfirmasi</strong>
                <div>Nilai harga jual pada sheet costing {formatRupiah(sellingPrice)}/pcs (HPP × {multiplier}). Pastikan angka {multiplier} adalah pengali harga jual yang benar.</div>
              </div>
            </div>

            <div className="insight-list-item">
              <span className="insight-num-badge badge-red">2</span>
              <div className="insight-item-content">
                <strong>Tanggal delivery {isDeliveryOverdue ? 'sudah lewat' : 'terjadwal'}</strong>
                <div>Delivery {deliveryDateDisplay}. {isDeliveryOverdue ? 'Perlu konfirmasi apakah pesanan sudah selesai, terlambat, atau jadwal belum diperbarui.' : 'Pastikan tahapan material dan CMT berjalan tepat waktu.'}</div>
              </div>
            </div>

            <div className="insight-list-item">
              <span className="insight-num-badge badge-red">3</span>
              <div className="insight-item-content">
                <strong>Toleransi aksesori 5%</strong>
                <div>Pastikan pembelian aksesori mengikuti perhitungan dan pembulatan sesuai satuan pembelian pemasok.</div>
              </div>
            </div>

            <div className="insight-list-item">
              <span className="insight-num-badge badge-red">4</span>
              <div className="insight-item-content">
                <strong>Stok bahan & PO</strong>
                <div>Cek ketersediaan kain dan aksesori di gudang serta status pemesanan dari supplier.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Rekomendasi Tindak Lanjut */}
        <div className="insight-card insight-card-rec">
          <div className="insight-header">
            <CheckCircle2 size={20} color="#059669" />
            <h3 className="insight-title">Rekomendasi Tindak Lanjut</h3>
          </div>
          <div className="insight-list">
            <div className="insight-list-item">
              <span className="insight-num-badge badge-green">1</span>
              <div className="insight-item-content">
                <strong>Validasi costing</strong>
                <div>Pastikan harga kain, consumption, CMT, dan harga aksesori sudah sesuai.</div>
              </div>
            </div>

            <div className="insight-list-item">
              <span className="insight-num-badge badge-green">2</span>
              <div className="insight-item-content">
                <strong>Validasi BOM</strong>
                <div>Cocokkan total kebutuhan bahan dengan jumlah PO dan pembagian warna.</div>
              </div>
            </div>

            <div className="insight-list-item">
              <span className="insight-num-badge badge-green">3</span>
              <div className="insight-item-content">
                <strong>Evaluasi margin</strong>
                <div>Hitung keuntungan kotor setelah harga jual resmi dikonfirmasi.</div>
              </div>
            </div>

            <div className="insight-list-item">
              <span className="insight-num-badge badge-green">4</span>
              <div className="insight-item-content">
                <strong>Kontrol pembelian</strong>
                <div>Sesuaikan kebutuhan bahan dengan stok aktual, barang yang sudah dipesan, dan toleransi produksi.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Kesimpulan */}
        <div className="insight-card insight-card-summary">
          <div className="insight-header">
            <Lightbulb size={20} color="#0284c7" />
            <h3 className="insight-title">Kesimpulan</h3>
          </div>
          <div className="insight-summary-body">
            <p>
              Secara aritmetika, total HPP {styleName} sudah konsisten dengan jumlah produksi dan biaya per pcs pada sheet costing.
            </p>
            <p>
              Namun, harga jual dan status delivery perlu dikonfirmasi sebelum digunakan sebagai dasar keputusan pembelian atau evaluasi profit.
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM FOCUS STRIP */}
      <div className="costing-focus-bar">
        <Target size={18} />
        <div>
          <strong>Fokus utama:</strong> memastikan harga jual, status delivery, ketersediaan bahan, dan kontrol pembelian agar produksi berjalan sesuai rencana dan tetap menguntungkan.
        </div>
      </div>

      {/* TOGGLE BUTTON FOR FULL TECHNICAL SPECS & REMARKS */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
        <button
          type="button"
          className="btn-toggle-detailed-specs"
          onClick={() => setShowFullSpecs(!showFullSpecs)}
        >
          {showFullSpecs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>{showFullSpecs ? 'Sembunyikan Rincian Teknis & Remarks' : 'Lihat Rincian Teknis Lengkap, Spesifikasi BOM & Diskusi Remarks'}</span>
        </button>
      </div>

      {/* EXPANDABLE SECTION: DETAILED TABLES & REMARKS */}
      {showFullSpecs && (
        <div className="expandable-specs-container fadeIn no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
          {/* SECTION 1: Detail Fabric (Lengkap) */}
          <div className="detail-section-card">
            <div className="section-card-header">
              <div className="section-title-group">
                <div className="section-icon-badge fabric-badge">
                  <Scissors size={18} />
                </div>
                <div>
                  <h2 className="section-title">Detail Fabric Lengkap (Bahan Baku Kain)</h2>
                  <p className="section-desc">Kebutuhan kain utama, lapisan interlining, pemakaian konsumsi per pcs dan total</p>
                </div>
              </div>
              <div className="section-header-stat font-mono">
                Subtotal: <strong>{formatRupiah(normalizedFabricCost)}</strong> / pcs
              </div>
            </div>

            <div className="table-responsive-container">
              <table className="precosting-detail-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }} className="th-center">No</th>
                    <th>Nama Fabric / Kain</th>
                    <th>Spesifikasi & Konstruksi</th>
                    <th>Bagian Garmen</th>
                    <th className="th-right">Konsumsi (Pcs)</th>
                    <th className="th-center">Satuan</th>
                    <th className="th-right">Harga Satuan</th>
                    <th className="th-right">Total Biaya / Pcs</th>
                    <th className="th-right">Biaya Semua Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {fabricsList.map((f, idx) => {
                    const costPerPcs = (Number(f.consumption) || 0) * (Number(f.unitPrice) || 0);
                    const costAllQty = costPerPcs * targetQty;
                    return (
                      <tr key={f.id || idx}>
                        <td className="td-center font-mono text-muted">{idx + 1}</td>
                        <td className="font-semibold text-dark">{f.name}</td>
                        <td className="text-secondary">{f.spec || '-'}</td>
                        <td><span className="part-tag">{f.part || 'Main Body'}</span></td>
                        <td className="td-right font-mono font-medium">{f.consumption}</td>
                        <td className="td-center text-secondary">{f.unit || 'Meter'}</td>
                        <td className="td-right font-mono">{formatRupiah(f.unitPrice || 0)}</td>
                        <td className="td-right font-mono font-semibold text-fabric">{formatRupiah(costPerPcs)}</td>
                        <td className="td-right font-mono font-bold text-total-qty">{formatRupiah(costAllQty)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: Detail Accessories (Lengkap) */}
          <div className="detail-section-card">
            <div className="section-card-header">
              <div className="section-title-group">
                <div className="section-icon-badge acc-badge">
                  <Package size={18} />
                </div>
                <div>
                  <h2 className="section-title">Detail Accessories & Trims (Lengkap)</h2>
                  <p className="section-desc">Kancing, benang, label, zipper, polybag, hangtag dan kemasan</p>
                </div>
              </div>
              <div className="section-header-stat font-mono">
                Subtotal: <strong>{formatRupiah(normalizedAccCost)}</strong> / pcs
              </div>
            </div>

            <div className="table-responsive-container">
              <table className="precosting-detail-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }} className="th-center">No</th>
                    <th>Nama Accessories / Trims</th>
                    <th>Spesifikasi Teknis</th>
                    <th className="th-right">Qty / Pcs</th>
                    <th className="th-center">Satuan</th>
                    <th className="th-right">Harga Satuan</th>
                    <th className="th-right">Total Biaya / Pcs</th>
                    <th className="th-right">Biaya Semua Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {accessoriesList.map((a, idx) => {
                    const costPerPcs = (Number(a.qtyPerPcs) || 0) * (Number(a.unitPrice) || 0);
                    const costAllQty = costPerPcs * targetQty;
                    return (
                      <tr key={a.id || idx}>
                        <td className="td-center font-mono text-muted">{idx + 1}</td>
                        <td className="font-semibold text-dark">{a.name}</td>
                        <td className="text-secondary">{a.spec || '-'}</td>
                        <td className="td-right font-mono font-medium">{a.qtyPerPcs}</td>
                        <td className="td-center text-secondary">{a.unit || 'Pcs'}</td>
                        <td className="td-right font-mono">{formatRupiah(a.unitPrice || 0)}</td>
                        <td className="td-right font-mono font-semibold text-acc">{formatRupiah(costPerPcs)}</td>
                        <td className="td-right font-mono font-bold text-total-qty">{formatRupiah(costAllQty)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: Detail Jasa CMT (Lengkap) */}
          <div className="detail-section-card">
            <div className="section-card-header">
              <div className="section-title-group">
                <div className="section-icon-badge jasa-badge">
                  <Layers size={18} />
                </div>
                <div>
                  <h2 className="section-title">Detail Jasa & Proses Produksi (CMT)</h2>
                  <p className="section-desc">Pola marker, potong, jahit CMT, finishing dan overhead produksi</p>
                </div>
              </div>
              <div className="section-header-stat font-mono">
                Subtotal: <strong>{formatRupiah(normalizedJasaCost)}</strong> / pcs
              </div>
            </div>

            <div className="table-responsive-container">
              <table className="precosting-detail-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }} className="th-center">No</th>
                    <th>Jenis Jasa / Proses</th>
                    <th>Klasifikasi Akuntansi</th>
                    <th>Uraian Pekerjaan</th>
                    <th className="th-right">Biaya Jasa / Pcs</th>
                    <th className="th-right">Biaya Semua Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(item.services && item.services.length > 0 ? item.services : [
                    { name: 'Jasa Cutting, Making & Trimming (CMT)', category: 'Direct Labor', description: 'Line jahit utama', unitPrice: normalizedJasaCost }
                  ]).map((s, idx) => {
                    const costPerPcs = Number(s.unitPrice) || 0;
                    const costAllQty = costPerPcs * targetQty;
                    return (
                      <tr key={s.id || idx}>
                        <td className="td-center font-mono text-muted">{idx + 1}</td>
                        <td className="font-semibold text-dark">{s.name}</td>
                        <td>
                          <span className={`category-pill ${s.category === 'Direct Labor' ? 'labor-pill' : 'overhead-pill'}`}>
                            {s.category || 'CMT'}
                          </span>
                        </td>
                        <td className="text-secondary">{s.description || '-'}</td>
                        <td className="td-right font-mono font-semibold text-jasa">{formatRupiah(costPerPcs)}</td>
                        <td className="td-right font-mono font-bold text-total-qty">{formatRupiah(costAllQty)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4: Remarks / Catatan & Riwayat Diskusi */}
          <div className="detail-section-card">
            <div className="section-card-header">
              <div className="section-title-group">
                <div className="section-icon-badge remarks-badge">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="section-title">Catatan & Remarks Precosting ({remarks.length})</h2>
                  <p className="section-desc">Riwayat catatan teknis kain, toleransi pola, spesifikasi trims dan instruksi approval</p>
                </div>
              </div>
            </div>

            {/* Add Remark Form */}
            <form onSubmit={handleAddRemarkSubmit} className="add-remark-form">
              <div className="remark-input-group">
                <textarea
                  className="remark-textarea"
                  rows="3"
                  placeholder="Tulis catatan/remarks untuk precosting ini..."
                  value={newRemarkText}
                  onChange={(e) => setNewRemarkText(e.target.value)}
                />
                <div className="remark-submit-bar">
                  <span className="remark-author-hint">
                    Posting sebagai: <strong>{user ? `${user.name} (${user.role})` : 'User'}</strong>
                  </span>
                  <button
                    type="submit"
                    className="btn-send-remark"
                    disabled={!newRemarkText.trim()}
                  >
                    <Send size={15} />
                    <span>Kirim Remarks</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Remarks History Feed */}
            <div className="remarks-history-feed">
              {remarks.length === 0 ? (
                <div className="no-remarks-hint">
                  Belum ada catatan untuk precosting ini. Tulis catatan pertama di atas.
                </div>
              ) : (
                remarks.map((rem) => (
                  <div key={rem.id} className="remark-card-item">
                    <div className="remark-item-header">
                      <div className="remark-author-info">
                        <span className="remark-author-name">{rem.author}</span>
                        {rem.role && <span className="remark-role-tag">{rem.role}</span>}
                      </div>
                      <span className="remark-timestamp">{rem.timestamp}</span>
                    </div>
                    <div className="remark-item-body">{rem.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* IMAGE ZOOM MODAL */}
      {isImageModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImageModalOpen(false)}>
          <div className="image-zoom-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="zoom-modal-header">
              <span className="zoom-title">{styleName} ({item.precostingNo})</span>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsImageModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="zoom-modal-body">
              <img
                src={decodeBase64Image(item.image)}
                alt={styleName}
                className="full-zoom-img"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
