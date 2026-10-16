import React, { useState } from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { formatRupiah, formatNumber, formatDate } from '../../utils/formatters';
import { decodeBase64Image } from '../../utils/imageUtils';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  Clock, 
  AlertTriangle, 
  Printer, 
  MessageSquare, 
  DollarSign, 
  FileSpreadsheet, 
  Layers, 
  Scissors, 
  Package, 
  Send, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  TrendingUp, 
  PieChart,
  Sparkles
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'fabric' | 'acc' | 'jasa' | 'finance'
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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

  // Percentage calculations for cost breakdown
  const targetQty = Number(item.targetQty || item.ProdQty || 1000);
  const fabricCostVal = Number(item.fabricCostPerPcs ?? item.totalKainPerPcs ?? item.totalKain ?? item.totalFabric ?? 0);
  const normalizedFabricCost = fabricCostVal > 100000 && targetQty > 1 ? Math.round(fabricCostVal / targetQty) : fabricCostVal;

  const accCostVal = Number(item.accCostPerPcs ?? item.accessoriesCostPerPcs ?? item.accPrice ?? 0);
  const normalizedAccCost = accCostVal > 50000 && targetQty > 1 && (item.hpp ? accCostVal > Number(item.hpp) : true) ? Math.round(accCostVal / targetQty) : accCostVal;

  const jasaCostVal = Number(item.jasaCostPerPcs ?? item.cmtCostPerPcs ?? item.cmtPrice ?? 0);
  const normalizedJasaCost = jasaCostVal > 500000 && targetQty > 1 ? Math.round(jasaCostVal / targetQty) : jasaCostVal;

  const hppVal = Number(item.hppPerPcs ?? item.hpp ?? item.HPP ?? (normalizedFabricCost + normalizedAccCost + normalizedJasaCost));
  const totalCost = hppVal > 0 ? hppVal : 1;
  const fabricPercent = Math.round((normalizedFabricCost / totalCost) * 100);
  const accPercent = Math.round((normalizedAccCost / totalCost) * 100);
  const jasaPercent = Math.round((normalizedJasaCost / totalCost) * 100);
  const bufferPercent = Math.max(0, 100 - (fabricPercent + accPercent + jasaPercent));

  return (
    <div className="detail-page-container">
      {/* Top Navigation & Action Bar */}
      <div className="detail-top-nav">
        <button 
          type="button" 
          className="btn-back-grid"
          onClick={clearSelectedPrecosting}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Grid Precosting</span>
        </button>

        <div className="detail-action-buttons no-print">
          <button 
            type="button" 
            className="btn-detail-action btn-print"
            onClick={handlePrint}
            title="Cetak Laporan Precosting"
          >
            <Printer size={15} />
            <span>Cetak / PDF</span>
          </button>

          {!(item.status === 'confirmed' || item.status === 'Approved') && (
            <button 
              type="button" 
              className="btn-detail-action btn-detail-approve"
              onClick={() => setApprovalModalItem(item)}
            >
              <CheckCircle size={15} />
              <span>Approve Precosting</span>
            </button>
          )}

          {!(item.status === 'reject' || item.status === 'rejected') && (
            <button 
              type="button" 
              className="btn-detail-action btn-detail-reject"
              onClick={() => setRejectModalItem(item)}
            >
              <XCircle size={15} />
              <span>Reject Precosting</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Card with Garment Photo */}
      <div className="detail-header-card">
        <div className="detail-header-flex">
          {/* Garment Image Showcase */}
          <div className="detail-image-box">
            <div 
              className="detail-image-wrapper"
              onClick={() => setIsImageModalOpen(true)}
              title="Klik untuk memperbesar gambar"
            >
              <img 
                src={decodeBase64Image(item.image)} 
                alt={item.itemName} 
                className="detail-garment-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/shirt.jpg';
                }}
              />
              <div className="image-zoom-overlay">
                <span>Perbesar Foto</span>
              </div>
            </div>
            <div className="image-caption-tag">
              Foto Sample Model Garmen
            </div>
          </div>

          {/* Specs & Information */}
          <div className="detail-header-main">
            <div className="precost-badge-row">
              <span className="detail-precost-no font-mono">{item.precostingNo}</span>
              <span className="detail-item-code font-mono">{item.itemCode || '-'}</span>
              <div className="detail-status-pill">
                {(item.status === 'confirmed' || item.status === 'Approved') && (
                  <span className="badge badge-success">
                    <CheckCircle size={13} className="badge-icon-left" /> Confirmed
                  </span>
                )}
                {item.status === 'Pending Approval' && (
                  <span className="badge badge-warning">
                    <Clock size={13} className="badge-icon-left" /> Menunggu Otorisasi
                  </span>
                )}
                {(item.status === 'reject' || item.status === 'rejected' || item.status === 'Revision') && (
                  <span className="badge badge-danger">
                    <XCircle size={13} className="badge-icon-left" /> Rejected
                  </span>
                )}
                {item.status === 'Draft' && (
                  <span className="badge badge-secondary">
                    Drafting
                  </span>
                )}
              </div>
            </div>

            <h1 className="detail-item-title">{item.itemName}</h1>

            {/* Item Meta Specs */}
            <div className="detail-meta-grid">
              <div className="detail-meta-item">
                <span className="meta-label">Kategori Pakaian</span>
                <span className="meta-value">{item.category}</span>
              </div>
              <div className="detail-meta-item">
                <span className="meta-label">Buyer / Brand</span>
                <span className="meta-value">{item.buyer || 'Internal Brand'}</span>
              </div>
              <div className="detail-meta-item">
                <span className="meta-label">Musim / Koleksi</span>
                <span className="meta-value">{item.season || 'Regular Season'}</span>
              </div>
              <div className="detail-meta-item highlight-meta">
                <span className="meta-label">Target Qty Produksi</span>
                <span className="meta-value font-mono font-bold">
                  {formatNumber(item.targetQty)} {item.unit || 'Pcs'}
                </span>
              </div>
              <div className="detail-meta-item">
                <span className="meta-label">Target Pengiriman</span>
                <span className="meta-value">{formatDate(item.deliveryDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Approval info strip if approved */}
        {(item.status === 'confirmed' || item.status === 'Approved') && (
          <div className="approved-info-banner">
            <ShieldCheck size={18} className="approved-banner-icon" />
            <div className="approved-banner-text">
              <strong>Telah Dikonfirmasi (Approved) oleh:</strong> {item.approvedBy || 'Authorized Manager'}
              {(item.approvedDate || item.approvalDate) && ` pada ${item.approvedDate || item.approvalDate}`}
              {item.approvalNotes && (
                <span className="approval-notes-quote"> — "{item.approvalNotes}"</span>
              )}
            </div>
          </div>
        )}

        {/* Rejected info banner */}
        {(item.status === 'reject' || item.status === 'rejected' || item.status === 'Revision') && (
          <div className="rejected-info-banner">
            <XCircle size={18} className="rejected-banner-icon" />
            <div className="rejected-banner-text">
              <strong>Status Precosting: Ditolak (Rejected).</strong>
              {item.approvalNotes && (
                <span className="approval-notes-quote"> Alasan Penolakan: "{item.approvalNotes}"</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {isImageModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImageModalOpen(false)}>
          <div className="image-zoom-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="zoom-modal-header">
              <span className="zoom-title">{item.itemName} ({item.precostingNo})</span>
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
                alt={item.itemName} 
                className="full-zoom-img"
              />
            </div>
          </div>
        </div>
      )}

      {/* KPI Costing Summary Bar (COGS, COGM, HPP Cards) */}
      <div className="detail-kpi-bar">
        {/* Total Fabric */}
        <div className="kpi-card fabric-kpi">
          <div className="kpi-card-header">
            <span>Biaya Fabric (Kain)</span>
            <span className="kpi-tag">Bahan Baku</span>
          </div>
          <div className="kpi-main-val font-mono">{formatRupiah(normalizedFabricCost)}</div>
          <div className="kpi-sub-val font-mono">
            Semua Qty: <strong>{formatRupiah(normalizedFabricCost * targetQty)}</strong>
          </div>
        </div>

        {/* Total Acc */}
        <div className="kpi-card acc-kpi">
          <div className="kpi-card-header">
            <span>Biaya Accessories</span>
            <span className="kpi-tag">Trims & Packaging</span>
          </div>
          <div className="kpi-main-val font-mono">{formatRupiah(normalizedAccCost)}</div>
          <div className="kpi-sub-val font-mono">
            Semua Qty: <strong>{formatRupiah(normalizedAccCost * targetQty)}</strong>
          </div>
        </div>

        {/* Total Jasa */}
        <div className="kpi-card jasa-kpi">
          <div className="kpi-card-header">
            <span>Biaya Jasa & CMT</span>
            <span className="kpi-tag">Upah & Jahit</span>
          </div>
          <div className="kpi-main-val font-mono">{formatRupiah(normalizedJasaCost)}</div>
          <div className="kpi-sub-val font-mono">
            Semua Qty: <strong>{formatRupiah(normalizedJasaCost * targetQty)}</strong>
          </div>
        </div>

        {/* COGM */}
        <div className="kpi-card cogm-kpi">
          <div className="kpi-card-header">
            <span>COGM (Biaya Pokok Prod.)</span>
            <span className="kpi-tag bold-tag">Direct + Overhead</span>
          </div>
          <div className="kpi-main-val font-mono text-purple">{formatRupiah(normalizedFabricCost + normalizedAccCost + normalizedJasaCost)}</div>
          <div className="kpi-sub-val font-mono">
            Semua Qty: <strong>{formatRupiah((normalizedFabricCost + normalizedAccCost + normalizedJasaCost) * targetQty)}</strong>
          </div>
        </div>

        {/* HPP / COGS */}
        <div className="kpi-card hpp-kpi">
          <div className="kpi-card-header">
            <span>HPP / COGS per Pcs</span>
            <span className="kpi-tag primary-tag">Final Precosting</span>
          </div>
          <div className="kpi-main-val font-mono text-emerald font-bold">{formatRupiah(hppVal)}</div>
          <div className="kpi-sub-val font-mono">
            Total Semua Qty: <strong className="text-emerald">{formatRupiah(hppVal * targetQty)}</strong>
          </div>
        </div>
      </div>

      {/* Cost Composition Visual Bar */}
      <div className="cost-composition-panel">
        <div className="composition-header">
          <div className="composition-title">
            <PieChart size={16} />
            <span>Proporsi Struktur Biaya per Kain (HPP: {formatRupiah(item.hppPerPcs)})</span>
          </div>
          <div className="composition-legend">
            <span className="legend-item"><span className="legend-dot fabric-dot" /> Fabric ({fabricPercent}%)</span>
            <span className="legend-item"><span className="legend-dot acc-dot" /> Accessories ({accPercent}%)</span>
            <span className="legend-item"><span className="legend-dot jasa-dot" /> Jasa CMT ({jasaPercent}%)</span>
            <span className="legend-item"><span className="legend-dot buffer-dot" /> Buffer & Overhead ({bufferPercent}%)</span>
          </div>
        </div>
        <div className="composition-bar-track">
          <div className="bar-segment fabric-bar" style={{ width: `${fabricPercent}%` }} title={`Fabric: ${fabricPercent}%`} />
          <div className="bar-segment acc-bar" style={{ width: `${accPercent}%` }} title={`Accessories: ${accPercent}%`} />
          <div className="bar-segment jasa-bar" style={{ width: `${jasaPercent}%` }} title={`Jasa CMT: ${jasaPercent}%`} />
          <div className="bar-segment buffer-bar" style={{ width: `${bufferPercent}%` }} title={`Buffer/Overhead: ${bufferPercent}%`} />
        </div>
      </div>

      {/* SECTION 1: Detail Fabric */}
      <div className="detail-section-card">
        <div className="section-card-header">
          <div className="section-title-group">
            <div className="section-icon-badge fabric-badge">
              <Scissors size={18} />
            </div>
            <div>
              <h2 className="section-title">1. Detail Fabric (Bahan Baku Kain)</h2>
              <p className="section-desc">Kebutuhan kain utama, lapisan interlining, pemakaian konsumsi per pcs dan total</p>
            </div>
          </div>
          <div className="section-header-stat font-mono">
            Subtotal: <strong>{formatRupiah(item.fabricCostPerPcs)}</strong> / pcs
          </div>
        </div>

        <div className="table-responsive-container">
          <table className="precosting-detail-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }} className="th-center">No</th>
                <th style={{ minWidth: '220px' }}>Nama Fabric / Kain</th>
                <th style={{ minWidth: '200px' }}>Spesifikasi & Konstruksi</th>
                <th style={{ minWidth: '150px' }}>Bagian Garmen</th>
                <th className="th-right" style={{ minWidth: '110px' }}>Konsumsi (Pcs)</th>
                <th className="th-center" style={{ minWidth: '70px' }}>Satuan</th>
                <th className="th-right" style={{ minWidth: '120px' }}>Harga Satuan</th>
                <th className="th-right" style={{ minWidth: '130px' }}>Total Biaya / Pcs</th>
                <th className="th-right" style={{ minWidth: '150px' }}>Biaya Semua Qty</th>
              </tr>
            </thead>
            <tbody>
              {item.fabrics.map((f, idx) => {
                const costPerPcs = (Number(f.consumption) || 0) * (Number(f.unitPrice) || 0);
                const costAllQty = costPerPcs * (Number(item.targetQty) || 0);
                return (
                  <tr key={f.id || idx}>
                    <td className="td-center font-mono text-muted">{idx + 1}</td>
                    <td className="font-semibold text-dark">{f.name}</td>
                    <td className="text-secondary">{f.spec || '-'}</td>
                    <td><span className="part-tag">{f.part || 'Main Body'}</span></td>
                    <td className="td-right font-mono font-medium">{f.consumption}</td>
                    <td className="td-center text-secondary">{f.unit}</td>
                    <td className="td-right font-mono">{formatRupiah(f.unitPrice)}</td>
                    <td className="td-right font-mono font-semibold text-fabric">{formatRupiah(costPerPcs)}</td>
                    <td className="td-right font-mono font-bold text-total-qty">{formatRupiah(costAllQty)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="tfoot-subtotal">
                <td colSpan="7" className="td-right font-bold">Subtotal Biaya Fabric:</td>
                <td className="td-right font-mono font-bold text-fabric">{formatRupiah(item.fabricCostPerPcs)}</td>
                <td className="td-right font-mono font-bold text-total-qty">{formatRupiah(item.totalFabricCostAllQty)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION 2: Detail Accessories */}
      <div className="detail-section-card">
        <div className="section-card-header">
          <div className="section-title-group">
            <div className="section-icon-badge acc-badge">
              <Package size={18} />
            </div>
            <div>
              <h2 className="section-title">2. Detail Accessories & Trims</h2>
              <p className="section-desc">Kancing, benang, label, zipper, polybag, hangtag dan kemasan master box</p>
            </div>
          </div>
          <div className="section-header-stat font-mono">
            Subtotal: <strong>{formatRupiah(item.accCostPerPcs)}</strong> / pcs
          </div>
        </div>

        <div className="table-responsive-container">
          <table className="precosting-detail-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }} className="th-center">No</th>
                <th style={{ minWidth: '220px' }}>Nama Accessories / Trims</th>
                <th style={{ minWidth: '200px' }}>Spesifikasi Teknis</th>
                <th className="th-right" style={{ minWidth: '100px' }}>Qty / Pcs</th>
                <th className="th-center" style={{ minWidth: '80px' }}>Satuan</th>
                <th className="th-right" style={{ minWidth: '110px' }}>Harga Satuan</th>
                <th className="th-right" style={{ minWidth: '130px' }}>Total Biaya / Pcs</th>
                <th className="th-right" style={{ minWidth: '150px' }}>Biaya Semua Qty</th>
              </tr>
            </thead>
            <tbody>
              {item.accessories.map((a, idx) => {
                const costPerPcs = (Number(a.qtyPerPcs) || 0) * (Number(a.unitPrice) || 0);
                const costAllQty = costPerPcs * (Number(item.targetQty) || 0);
                return (
                  <tr key={a.id || idx}>
                    <td className="td-center font-mono text-muted">{idx + 1}</td>
                    <td className="font-semibold text-dark">{a.name}</td>
                    <td className="text-secondary">{a.spec || '-'}</td>
                    <td className="td-right font-mono font-medium">{a.qtyPerPcs}</td>
                    <td className="td-center text-secondary">{a.unit}</td>
                    <td className="td-right font-mono">{formatRupiah(a.unitPrice)}</td>
                    <td className="td-right font-mono font-semibold text-acc">{formatRupiah(costPerPcs)}</td>
                    <td className="td-right font-mono font-bold text-total-qty">{formatRupiah(costAllQty)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="tfoot-subtotal">
                <td colSpan="6" className="td-right font-bold">Subtotal Biaya Accessories:</td>
                <td className="td-right font-mono font-bold text-acc">{formatRupiah(item.accCostPerPcs)}</td>
                <td className="td-right font-mono font-bold text-total-qty">{formatRupiah(item.totalAccCostAllQty)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION 3: Detail Jasa */}
      <div className="detail-section-card">
        <div className="section-card-header">
          <div className="section-title-group">
            <div className="section-icon-badge jasa-badge">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="section-title">3. Detail Jasa & Proses Produksi (CMT)</h2>
              <p className="section-desc">Pola marker, potong, jahit CMT, sablon/bordir, wash, finishing dan overhead</p>
            </div>
          </div>
          <div className="section-header-stat font-mono">
            Subtotal: <strong>{formatRupiah(item.jasaCostPerPcs)}</strong> / pcs
          </div>
        </div>

        <div className="table-responsive-container">
          <table className="precosting-detail-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }} className="th-center">No</th>
                <th style={{ minWidth: '230px' }}>Jenis Jasa / Proses</th>
                <th style={{ minWidth: '150px' }}>Klasifikasi Akuntansi</th>
                <th style={{ minWidth: '220px' }}>Uraian Pekerjaan & Standar</th>
                <th className="th-right" style={{ minWidth: '130px' }}>Biaya Jasa / Pcs</th>
                <th className="th-right" style={{ minWidth: '150px' }}>Biaya Semua Qty</th>
              </tr>
            </thead>
            <tbody>
              {item.services.map((s, idx) => {
                const costPerPcs = Number(s.unitPrice) || 0;
                const costAllQty = costPerPcs * (Number(item.targetQty) || 0);
                return (
                  <tr key={s.id || idx}>
                    <td className="td-center font-mono text-muted">{idx + 1}</td>
                    <td className="font-semibold text-dark">{s.name}</td>
                    <td>
                      <span className={`category-pill ${s.category === 'Direct Labor' ? 'labor-pill' : 'overhead-pill'}`}>
                        {s.category}
                      </span>
                    </td>
                    <td className="text-secondary">{s.description || '-'}</td>
                    <td className="td-right font-mono font-semibold text-jasa">{formatRupiah(costPerPcs)}</td>
                    <td className="td-right font-mono font-bold text-total-qty">{formatRupiah(costAllQty)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="tfoot-subtotal">
                <td colSpan="4" className="td-right font-bold">Subtotal Biaya Jasa & CMT:</td>
                <td className="td-right font-mono font-bold text-jasa">{formatRupiah(item.jasaCostPerPcs)}</td>
                <td className="td-right font-mono font-bold text-total-qty">{formatRupiah(item.totalJasaCostAllQty)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION 4: Financial Summary (COGS, COGM, HPP Breakdown) */}
      <div className="detail-section-card financial-breakdown-card">
        <div className="section-card-header">
          <div className="section-title-group">
            <div className="section-icon-badge financial-badge">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="section-title">4. Pemetaan Finansial: COGS, COGM & HPP</h2>
              <p className="section-desc">Kalkulasi akuntansi biaya garmen, margin keuntungan dan rekomendasi harga jual</p>
            </div>
          </div>
          <div className="section-header-stat font-mono">
            Target Batch: <strong>{formatNumber(item.targetQty)} Pcs</strong>
          </div>
        </div>

        <div className="accounting-summary-grid">
          {/* Detailed Calculation Table */}
          <div className="accounting-table-wrapper">
            <table className="accounting-breakdown-table">
              <thead>
                <tr>
                  <th>Komponen Biaya</th>
                  <th className="th-right">Biaya per Pcs (Kain)</th>
                  <th className="th-right">Biaya Semua Qty ({formatNumber(item.targetQty)} pcs)</th>
                  <th className="th-center">% Porsi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="acc-item-title">Bahan Baku Langsung (Direct Materials)</div>
                    <div className="acc-item-sub">Fabric ({formatRupiah(item.fabricCostPerPcs)}) + Acc ({formatRupiah(item.accCostPerPcs)})</div>
                  </td>
                  <td className="td-right font-mono font-semibold">{formatRupiah(item.directMaterialPerPcs)}</td>
                  <td className="td-right font-mono">{formatRupiah(item.directMaterialAllQty)}</td>
                  <td className="td-center font-mono">{Math.round((item.directMaterialPerPcs / totalCost) * 100)}%</td>
                </tr>
                <tr>
                  <td>
                    <div className="acc-item-title">Tenaga Kerja Langsung (Direct Labor)</div>
                    <div className="acc-item-sub">Jasa Potong (Cutting), Jahit CMT & Pasang Kancing</div>
                  </td>
                  <td className="td-right font-mono font-semibold">{formatRupiah(item.directLaborPerPcs)}</td>
                  <td className="td-right font-mono">{formatRupiah(item.directLaborAllQty)}</td>
                  <td className="td-center font-mono">{Math.round((item.directLaborPerPcs / totalCost) * 100)}%</td>
                </tr>
                <tr>
                  <td>
                    <div className="acc-item-title">Overhead Pabrik (Factory Overhead)</div>
                    <div className="acc-item-sub">Pola marker, sablon/bordir, wash, QC, listrik & supervisi</div>
                  </td>
                  <td className="td-right font-mono font-semibold">{formatRupiah(item.factoryOverheadPerPcs)}</td>
                  <td className="td-right font-mono">{formatRupiah(item.factoryOverheadAllQty)}</td>
                  <td className="td-center font-mono">{Math.round((item.factoryOverheadPerPcs / totalCost) * 100)}%</td>
                </tr>
                <tr className="tr-highlight-cogm">
                  <td>
                    <div className="acc-item-title font-bold text-purple">
                      COGM (Cost of Goods Manufactured / Biaya Pokok Produksi)
                    </div>
                    <div className="acc-item-sub">Direct Material + Direct Labor + Factory Overhead</div>
                  </td>
                  <td className="td-right font-mono font-bold text-purple">{formatRupiah(item.cogmPerPcs)}</td>
                  <td className="td-right font-mono font-bold text-purple">{formatRupiah(item.cogmAllQty)}</td>
                  <td className="td-center font-mono font-bold text-purple">
                    {Math.round((item.cogmPerPcs / totalCost) * 100)}%
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="acc-item-title">Buffer Penyusutan & Handling Ekspedisi (2.5%)</div>
                    <div className="acc-item-sub">Toleransi susut kain, reject finishing & transport</div>
                  </td>
                  <td className="td-right font-mono font-semibold">{formatRupiah(item.bufferPerPcs)}</td>
                  <td className="td-right font-mono">{formatRupiah(item.bufferAllQty)}</td>
                  <td className="td-center font-mono">{bufferPercent}%</td>
                </tr>
                <tr className="tr-highlight-hpp">
                  <td>
                    <div className="acc-item-title font-bold text-emerald">
                      HPP / COGS (Harga Pokok Penjualan)
                    </div>
                    <div className="acc-item-sub font-semibold">Total Modal per Unit untuk Delivery</div>
                  </td>
                  <td className="td-right font-mono font-bold text-emerald text-lg">{formatRupiah(item.hppPerPcs)}</td>
                  <td className="td-right font-mono font-bold text-emerald text-lg">{formatRupiah(item.hppAllQty)}</td>
                  <td className="td-center font-mono font-bold text-emerald">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing & Commercial Target Card */}
          <div className="commercial-target-card">
            <h3 className="commercial-card-title">
              <Sparkles size={16} /> Target Harga Jual & Margin
            </h3>
            
            <div className="commercial-metric-row">
              <span className="comm-label">Target Gross Margin:</span>
              <span className="comm-val font-mono">
                {Math.round((item.targetMarkupRate || 0.30) * 100)}% (Standard Retail / FOB)
              </span>
            </div>

            <div className="commercial-metric-row">
              <span className="comm-label">Rekomendasi Harga Jual (FOB):</span>
              <span className="comm-val font-mono font-bold text-primary-gradient text-lg">
                {formatRupiah(item.targetSellingPricePerPcs)} <span className="text-xs text-muted">/ pcs</span>
              </span>
            </div>

            <div className="commercial-metric-row">
              <span className="comm-label">Estimasi Gross Profit per Pcs:</span>
              <span className="comm-val font-mono font-semibold text-emerald">
                +{formatRupiah(item.targetGrossProfitPerPcs)}
              </span>
            </div>

            <div className="commercial-divider" />

            <div className="commercial-metric-row">
              <span className="comm-label">Total Omzet Proyek ({formatNumber(item.targetQty)} pcs):</span>
              <span className="comm-val font-mono font-bold">
                {formatRupiah(item.totalRevenueAllQty)}
              </span>
            </div>

            <div className="commercial-metric-row">
              <span className="comm-label">Total Keuntungan Kotor (All Qty):</span>
              <span className="comm-val font-mono font-bold text-emerald">
                +{formatRupiah(item.totalProfitAllQty)}
              </span>
            </div>

            <div className="commercial-note">
              *Catatan: Harga di atas merupakan rekomendasi berdasarkan baseline HPP {formatRupiah(item.hppPerPcs)} per potong.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Remarks / Catatan & Riwayat Diskusi */}
      <div className="detail-section-card no-print">
        <div className="section-card-header">
          <div className="section-title-group">
            <div className="section-icon-badge remarks-badge">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="section-title">5. Catatan & Remarks Precosting ({remarks.length})</h2>
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
              placeholder="Tulis catatan/remarks untuk precosting ini (misal: penyesuaian konsumsi kain, toleransi susut, catatan CMT)..."
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

      {/* SECTION 6: Bottom Approval Action Bar */}
      <div className="bottom-approval-bar no-print">
        <div className="bar-info-side">
          <div className="bar-item-name">{item.itemName} ({item.precostingNo})</div>
          <div className="bar-cost-recap font-mono">
            HPP: <strong>{formatRupiah(item.hppPerPcs)}</strong> / pcs • Total Modal: <strong>{formatRupiah(item.hppAllQty)}</strong>
          </div>
        </div>
        <div className="bar-actions-side">
          <button
            type="button"
            className="btn-bottom-remarks"
            onClick={() => {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
          >
            <MessageSquare size={16} />
            <span>Tambah Remarks</span>
          </button>

          {!(item.status === 'confirmed' || item.status === 'Approved') && (
            <button
              type="button"
              className="btn-bottom-approve"
              onClick={() => setApprovalModalItem(item)}
            >
              <CheckCircle size={16} />
              <span>Approve Precosting Sekarang</span>
            </button>
          )}

          {!(item.status === 'reject' || item.status === 'rejected') && (
            <button
              type="button"
              className="btn-bottom-reject"
              onClick={() => setRejectModalItem(item)}
            >
              <XCircle size={16} />
              <span>Reject Precosting</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
