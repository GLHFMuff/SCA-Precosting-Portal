import React, { useState } from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { decodeBase64Image } from '../../utils/imageUtils';
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileCheck2,
  ArrowUpDown,
  LayoutGrid,
  List,
  Layers,
  ChevronRight,
  Sparkles,
  Database,
  RotateCw
} from 'lucide-react';

export const PrecostingGrid = () => {
  const {
    precostings,
    isLoading,
    apiError,
    selectPrecosting,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    setApprovalModalItem,
    setRejectModalItem,
    setRemarksModalItem,
    approvePrecosting,
    showToast,
    isBackendOnline,
    refreshFromBackend
  } = usePrecosting();

  // Mobile layout mode toggle: 'card' (optimal for HP) or 'table' (compact scrollable)
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'

  // Filter & Search
  const filteredItems = precostings.filter((item) => {
    const matchesSearch =
      item.precostingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.buyer && item.buyer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'confirmed'
        ? item.status === 'confirmed' || item.status === 'Approved'
        : statusFilter === 'reject'
        ? item.status === 'reject' || item.status === 'rejected' || item.status === 'Revision'
        : item.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return (b.createdDate || '').localeCompare(a.createdDate || '');
    }
    if (sortBy === 'qty-desc') {
      return (Number(b.targetQty) || 0) - (Number(a.targetQty) || 0);
    }
    if (sortBy === 'cost-desc') {
      return (Number(b.hppPerPcs) || 0) - (Number(a.hppPerPcs) || 0);
    }
    if (sortBy === 'name-asc') {
      return a.itemName.localeCompare(b.itemName);
    }
    return 0;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'Approved':
        return (
          <span className="badge badge-success">
            <CheckCircle size={12} className="badge-icon-left" /> Confirmed
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="badge badge-warning">
            <Clock size={12} className="badge-icon-left" /> Menunggu Otorisasi
          </span>
        );
      case 'reject':
      case 'rejected':
      case 'Revision':
        return (
          <span className="badge badge-danger">
            <XCircle size={12} className="badge-icon-left" /> Rejected
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="badge badge-secondary">
            Draft
          </span>
        );
    }
  };

  const handleApprove = (item) => {
    setApprovalModalItem(item);
  };

  return (
    <div className="grid-container">
      {/* Search & Filter Toolbar */}
      <div className="grid-toolbar">
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Cari nomor precosting, nama item pakaian, buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>

        <div className="filter-controls-row">
          {/* Status Filter Tabs */}
          <div className="status-tabs-wrapper">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'Pending Approval', label: 'Menunggu Approval' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'reject', label: 'Rejected' },
              { id: 'Draft', label: 'Draft' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`status-tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort & Mobile View Toggle */}
          <div className="toolbar-right-tools">
            <div className="sort-select-wrapper">
              <ArrowUpDown size={14} className="sort-icon" />
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Terbaru</option>
                <option value="qty-desc">Target Qty Terbesar</option>
                <option value="cost-desc">HPP Terbesar</option>
                <option value="name-asc">Nama Style (A-Z)</option>
              </select>
            </div>

            {/* Toggle Table vs Card View for HP */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Tampilan Tabel"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
                title="Tampilan Kartu (Optimal HP)"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Results Header info */}
      <div className="grid-meta-bar">
        <div className="grid-meta-left">
          <span className="results-count">
            Menampilkan <strong>{sortedItems.length}</strong> dari {precostings.length} Precosting
          </span>
        </div>
        <div className="grid-meta-right">
          <button
            type="button"
            className="btn-sync-refresh"
            onClick={async () => {
              const ok = await refreshFromBackend();
              if (ok) {
                if (showToast) showToast('Data berhasil disinkronkan', 'success');
              } else {
                if (showToast) showToast('Gagal memuat dari backend API.', 'error');
              }
            }}
            title="Muat ulang data terbaru dari PostgreSQL via API"
          >
            <RotateCw size={13} className="sync-icon" />
            <span>Reload</span>
          </button>
          <span className="currency-hint">Mata Uang: IDR (Rupiah) • Biaya per Pcs</span>
        </div>
      </div>

      {/* Main Table View (Desktop & Responsive Scroll) */}
      <div className={`table-view-wrapper ${viewMode === 'card' ? 'hidden-on-mobile' : ''}`}>
        <div className="table-responsive-container">
          <table className="precosting-table">
            <thead>
              <tr>
                <th style={{ minWidth: '130px' }}>Nomor Precosting</th>
                <th className="th-center" style={{ width: '65px' }}>Image</th>
                <th className="th-center" style={{ minWidth: '105px' }}>
                  Qty Produksi<br />
                  <span className="th-sub">(Pcs)</span>
                </th>
                <th style={{ minWidth: '220px' }}>Nama Style</th>
                <th className="th-center" style={{ minWidth: '95px' }}>
                  Consm<br />
                  <span className="th-sub">(per pcs)</span>
                </th>
                <th className="th-right" style={{ minWidth: '120px' }}>
                  Harga Fabric<br />
                  <span className="th-sub">(per unit)</span>
                </th>
                <th className="th-right" style={{ minWidth: '140px' }}>
                  Total Kain<br />
                  <span className="th-sub">(Harga Fabric × Consm)</span>
                </th>
                <th className="th-right" style={{ minWidth: '130px' }}>
                  Harga CMT<br />
                  <span className="th-sub">(Total Jasa)</span>
                </th>
                <th className="th-right" style={{ minWidth: '125px' }}>
                  Harga Accesories<br />
                  <span className="th-sub">(Acc per pcs)</span>
                </th>
                <th className="th-right" style={{ minWidth: '120px' }}>
                  HPP<br />
                  <span className="th-sub">(per pcs)</span>
                </th>
                <th className="th-right" style={{ minWidth: '110px' }}>
                  PPN<br />
                  <span className="th-sub">(11%)</span>
                </th>
                <th className="th-center" style={{ minWidth: '235px' }}>
                  Action<br />
                  <span className="th-sub">(Detail & Approval)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="12" className="empty-state-cell">
                    <div className="empty-state">
                      <RotateCw size={32} className="empty-icon spin-animation" />
                      <h4>Memuat data dari PostgreSQL...</h4>
                      <p>Mengambil data precosting langsung melalui API backend.</p>
                    </div>
                  </td>
                </tr>
              ) : apiError && precostings.length === 0 ? (
                <tr>
                  <td colSpan="12" className="empty-state-cell">
                    <div className="empty-state">
                      <AlertTriangle size={36} className="empty-icon text-amber" />
                      <h4>Koneksi API Server Terputus</h4>
                      <p>{apiError}</p>
                      <button
                        type="button"
                        className="btn-sync-refresh"
                        style={{ marginTop: '12px', display: 'inline-flex' }}
                        onClick={refreshFromBackend}
                      >
                        <RotateCw size={14} className="sync-icon" />
                        <span>Coba Hubungkan Lagi</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan="12" className="empty-state-cell">
                    <div className="empty-state">
                      <Layers size={36} className="empty-icon" />
                      <h4>Tidak ada data precosting di database</h4>
                      <p>Data tabel "PrecostingHeader" kosong atau filter pencarian tidak sesuai.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const remarksCount = item.remarks ? item.remarks.length : 0;
                  const targetQty = Number(item.targetQty || item.ProdQty || 1000);
                  const consmVal = Number(item.consm ?? item.Consume ?? item.mainFabricConsumption ?? item.fabrics?.[0]?.consumption ?? 0);
                  const consmUnit = item.mainFabricUnit === 'Meter' ? 'm' : (item.mainFabricUnit || 'm');

                  const fabricPrice = Number(
                    item.fabricPrice ??
                    item.FabricPrice ??
                    item.hargaFabric ??
                    item.mainFabricUnitPrice ??
                    item.fabrics?.[0]?.unitPrice ??
                    0
                  );

                  let totalFabricPerPcs = Number(
                    item.fabricCostPerPcs ??
                    item.totalKainPerPcs ??
                    item.totalKain ??
                    item.totalFabric ??
                    item.TotalFabricPrice ??
                    0
                  );
                  if (totalFabricPerPcs > 100000 && targetQty > 1 && (fabricPrice === 0 || totalFabricPerPcs > fabricPrice * 2)) {
                    totalFabricPerPcs = Math.round(totalFabricPerPcs / targetQty);
                  }
                  if (totalFabricPerPcs === 0 && consmVal > 0 && fabricPrice > 0) {
                    totalFabricPerPcs = Math.round(consmVal * fabricPrice);
                  }

                  let cmtPriceVal = Number(
                    item.jasaCostPerPcs ??
                    item.cmtCostPerPcs ??
                    item.cmtPrice ??
                    item.hargaCmt ??
                    item.CMTPrice ??
                    0
                  );
                  if (cmtPriceVal > 500000 && targetQty > 1) {
                    cmtPriceVal = Math.round(cmtPriceVal / targetQty);
                  }

                  let accPriceVal = Number(
                    item.accCostPerPcs ??
                    item.accessoriesCostPerPcs ??
                    item.accPrice ??
                    item.hargaAccessories ??
                    item.AccPrice ??
                    0
                  );
                  if (accPriceVal > 50000 && targetQty > 1 && (item.hpp ? accPriceVal > Number(item.hpp) : true)) {
                    accPriceVal = Math.round(accPriceVal / targetQty);
                  }

                  let hppVal = Number(item.hppPerPcs ?? item.hpp ?? item.HPP ?? 0);
                  if (hppVal === 0) {
                    const base = totalFabricPerPcs + cmtPriceVal + accPriceVal;
                    hppVal = base > 0 ? Math.round(base * 1.025) : 0;
                  }

                  const ppnVal = Number(item.ppnPerPcs ?? item.taxPrice ?? item.TaxPrice ?? item.ppn ?? Math.round(hppVal * 0.11));

                  return (
                    <tr key={item.id} className="table-row-hover">
                      {/* 1. Nomor Precosting */}
                      <td className="td-precosting-no font-mono font-bold">
                        <button
                          type="button"
                          className="link-precosting-no"
                          onClick={() => selectPrecosting(item.id)}
                          title="Lihat Detail Precosting"
                        >
                          {item.precostingNo}
                        </button>
                      </td>

                      {/* 2. Image */}
                      <td className="td-center td-image-cell">
                        <img
                          src={decodeBase64Image(item.image)}
                          alt={item.itemName}
                          className="grid-thumb-img"
                          onClick={() => selectPrecosting(item.id)}
                          title="Klik untuk lihat detail style"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/shirt.jpg';
                          }}
                        />
                      </td>

                      {/* 3. Qty Produksi */}
                      <td className="td-center font-mono">
                        <span className="qty-pill">
                          {formatNumber(item.targetQty)} Pcs
                        </span>
                      </td>

                      {/* 4. Nama Style */}
                      <td className="td-item-name">
                        <div className="style-name-block">
                          <button
                            type="button"
                            className="item-title font-semibold text-left-btn"
                            onClick={() => selectPrecosting(item.id)}
                          >
                            {item.itemName}
                          </button>
                          <div className="item-meta-sub">
                            <span className="item-category-tag">{item.category}</span>
                            {item.buyer && <span className="item-buyer-name">• {item.buyer}</span>}
                            <span className="style-status-inline">{getStatusBadge(item.status)}</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Consm */}
                      <td className="td-center font-mono">
                        <div className="consm-display">
                          <span className="consm-val font-bold">{consmVal}</span>
                          <span className="consm-unit text-muted"> {consmUnit}</span>
                          {item.fabrics && item.fabrics.length > 1 && (
                            <div className="consm-extra-badge">
                              +{item.fabrics.length - 1} kain
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. Harga Fabric */}
                      <td className="td-right font-mono font-medium">
                        {formatRupiah(fabricPrice)}
                      </td>

                      {/* 7. Total Kain (harga fabric * consm) */}
                      <td className="td-right font-mono font-semibold text-fabric">
                        {formatRupiah(totalFabricPerPcs)}
                      </td>

                      {/* 8. Harga CMT (total jasa) */}
                      <td className="td-right font-mono font-semibold text-jasa">
                        {formatRupiah(cmtPriceVal)}
                      </td>

                      {/* 9. Harga Accesories */}
                      <td className="td-right font-mono font-semibold text-acc">
                        {formatRupiah(accPriceVal)}
                      </td>

                      {/* 10. HPP */}
                      <td className="td-right font-mono font-bold text-hpp">
                        {formatRupiah(hppVal)}
                      </td>

                      {/* 11. PPN */}
                      <td className="td-right font-mono font-semibold text-ppn">
                        {formatRupiah(ppnVal)}
                      </td>

                      {/* 12. Action (Detail & Approve / Not Approve) */}
                      <td className="td-center td-actions-cell">
                        <div className="grid-action-buttons">
                          {/* Detail Button */}
                          <button
                            type="button"
                            className="btn-action btn-view-detail"
                            onClick={() => selectPrecosting(item.id)}
                            title="Buka View Detail Lengkap"
                          >
                            <Eye size={13} />
                            <span>Detail</span>
                          </button>

                          {/* Approve Button (Hanya tampil jika belum approve/confirmed) */}
                          {!(item.status === 'confirmed' || item.status === 'Approved') && (
                            <button
                              type="button"
                              className="btn-action btn-approve"
                              onClick={() => handleApprove(item)}
                              title="Setujui & Konfirmasi Precosting Ini"
                            >
                              <CheckCircle2 size={13} />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Reject Button (Hanya tampil jika belum di-reject) */}
                          {!(item.status === 'reject' || item.status === 'rejected') && (
                            <button
                              type="button"
                              className="btn-action btn-not-approve"
                              onClick={() => setRejectModalItem(item)}
                              title="Tolak (Reject) Precosting & Beri Catatan"
                            >
                              <XCircle size={13} />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Optimized for Smartphones / HP) */}
      <div className={`card-view-wrapper ${viewMode === 'table' ? 'hidden-on-desktop' : ''}`}>
        {isLoading ? (
          <div className="empty-state mobile-empty">
            <RotateCw size={32} className="empty-icon spin-animation" />
            <h4>Memuat data dari PostgreSQL...</h4>
            <p>Mengambil data precosting dari API.</p>
          </div>
        ) : apiError && precostings.length === 0 ? (
          <div className="empty-state mobile-empty">
            <AlertTriangle size={36} className="empty-icon text-amber" />
            <h4>Koneksi API Gagal</h4>
            <p>{apiError}</p>
            <button
              type="button"
              className="btn-sync-refresh"
              style={{ marginTop: '12px', display: 'inline-flex' }}
              onClick={refreshFromBackend}
            >
              <RotateCw size={14} className="sync-icon" />
              <span>Coba Hubungkan Lagi</span>
            </button>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="empty-state mobile-empty">
            <Layers size={36} className="empty-icon" />
            <h4>Tidak ada data precosting di database</h4>
            <p>Data tabel "PrecostingHeader" kosong atau filter pencarian tidak sesuai.</p>
          </div>
        ) : (
          sortedItems.map((item) => {
            const targetQty = Number(item.targetQty || item.ProdQty || 1000);
            const consmVal = Number(item.consm ?? item.Consume ?? item.mainFabricConsumption ?? item.fabrics?.[0]?.consumption ?? 0);
            const consmUnit = item.mainFabricUnit === 'Meter' ? 'm' : (item.mainFabricUnit || 'm');

            const fabricPrice = Number(
              item.fabricPrice ??
              item.FabricPrice ??
              item.hargaFabric ??
              item.mainFabricUnitPrice ??
              item.fabrics?.[0]?.unitPrice ??
              0
            );

            let totalFabricPerPcs = Number(
              item.fabricCostPerPcs ??
              item.totalKainPerPcs ??
              item.totalKain ??
              item.totalFabric ??
              item.TotalFabricPrice ??
              0
            );
            if (totalFabricPerPcs > 100000 && targetQty > 1 && (fabricPrice === 0 || totalFabricPerPcs > fabricPrice * 2)) {
              totalFabricPerPcs = Math.round(totalFabricPerPcs / targetQty);
            }
            if (totalFabricPerPcs === 0 && consmVal > 0 && fabricPrice > 0) {
              totalFabricPerPcs = Math.round(consmVal * fabricPrice);
            }

            let cmtPriceVal = Number(
              item.jasaCostPerPcs ??
              item.cmtCostPerPcs ??
              item.cmtPrice ??
              item.hargaCmt ??
              item.CMTPrice ??
              0
            );
            if (cmtPriceVal > 500000 && targetQty > 1) {
              cmtPriceVal = Math.round(cmtPriceVal / targetQty);
            }

            let accPriceVal = Number(
              item.accCostPerPcs ??
              item.accessoriesCostPerPcs ??
              item.accPrice ??
              item.hargaAccessories ??
              item.AccPrice ??
              0
            );
            if (accPriceVal > 50000 && targetQty > 1 && (item.hpp ? accPriceVal > Number(item.hpp) : true)) {
              accPriceVal = Math.round(accPriceVal / targetQty);
            }

            let hppVal = Number(item.hppPerPcs ?? item.hpp ?? item.HPP ?? 0);
            if (hppVal === 0) {
              const base = totalFabricPerPcs + cmtPriceVal + accPriceVal;
              hppVal = base > 0 ? Math.round(base * 1.025) : 0;
            }

            const ppnVal = Number(item.ppnPerPcs ?? item.taxPrice ?? item.TaxPrice ?? item.ppn ?? Math.round(hppVal * 0.11));

            return (
              <div key={item.id} className="mobile-precost-card">
                {/* Card Top Row: Image + Header info */}
                <div className="card-top-row">
                  <img
                    src={decodeBase64Image(item.image)}
                    alt={item.itemName}
                    className="card-thumb-img"
                    onClick={() => selectPrecosting(item.id)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/shirt.jpg';
                    }}
                  />
                  <div className="card-header-texts">
                    <div className="card-precost-line">
                      <span className="card-precosting-no font-mono">{item.precostingNo}</span>
                      <span className="card-qty-badge font-mono">{formatNumber(item.targetQty)} Pcs</span>
                    </div>
                    <div
                      className="card-item-title"
                      onClick={() => selectPrecosting(item.id)}
                    >
                      {item.itemName}
                    </div>
                    <div className="card-item-category">
                      {item.category} {item.buyer && `• ${item.buyer}`}
                    </div>
                  </div>
                  <div className="card-status-wrapper">
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Financial Metric Grid: Consm, Fabric, Total Kain, CMT, Acc, HPP, PPN */}
                <div className="card-costs-grid-compact">
                  <div className="card-cost-box">
                    <span className="box-label">Consm</span>
                    <span className="box-val font-mono">
                      {consmVal} {consmUnit}
                    </span>
                  </div>
                  <div className="card-cost-box">
                    <span className="box-label">Harga Fabric</span>
                    <span className="box-val font-mono">{formatRupiah(fabricPrice)}</span>
                  </div>
                  <div className="card-cost-box highlight-cost-box">
                    <span className="box-label">Total Kain</span>
                    <span className="box-val font-mono text-fabric font-bold">{formatRupiah(totalFabricPerPcs)}</span>
                  </div>
                  <div className="card-cost-box">
                    <span className="box-label">Harga CMT</span>
                    <span className="box-val font-mono text-jasa font-semibold">{formatRupiah(cmtPriceVal)}</span>
                  </div>
                  <div className="card-cost-box">
                    <span className="box-label">Harga Acc</span>
                    <span className="box-val font-mono text-acc font-semibold">{formatRupiah(accPriceVal)}</span>
                  </div>
                  <div className="card-cost-box highlight-hpp-box">
                    <span className="box-label">HPP / Pcs</span>
                    <span className="box-val font-mono text-hpp font-bold">{formatRupiah(hppVal)}</span>
                  </div>
                  <div className="card-cost-box">
                    <span className="box-label">PPN (11%)</span>
                    <span className="box-val font-mono text-ppn font-semibold">{formatRupiah(ppnVal)}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="card-actions-row">
                  <button
                    type="button"
                    className="card-btn btn-view-detail"
                    onClick={() => selectPrecosting(item.id)}
                  >
                    <Eye size={14} />
                    <span>Detail</span>
                  </button>

                  {/* Mobile Approve Button (Hanya tampil jika belum approve/confirmed) */}
                  {!(item.status === 'confirmed' || item.status === 'Approved') && (
                    <button
                      type="button"
                      className="card-btn btn-approve"
                      onClick={() => handleApprove(item)}
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve</span>
                    </button>
                  )}

                  {/* Mobile Reject Button (Hanya tampil jika belum di-reject) */}
                  {!(item.status === 'reject' || item.status === 'rejected') && (
                    <button
                      type="button"
                      className="card-btn btn-not-approve"
                      onClick={() => setRejectModalItem(item)}
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
