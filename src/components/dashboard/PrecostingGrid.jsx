import React, { useState } from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileCheck2, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const PrecostingGrid = () => {
  const { 
    precostings, 
    selectPrecosting, 
    searchTerm, 
    setSearchTerm, 
    statusFilter, 
    setStatusFilter,
    sortBy,
    setSortBy,
    setApprovalModalItem,
    setRemarksModalItem
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
      statusFilter === 'ALL' || item.status === statusFilter;

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
      return (Number(b.hppAllQty) || 0) - (Number(a.hppAllQty) || 0);
    }
    if (sortBy === 'name-asc') {
      return a.itemName.localeCompare(b.itemName);
    }
    return 0;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="badge badge-success">
            <CheckCircle size={13} className="badge-icon-left" /> Disetujui
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="badge badge-warning">
            <Clock size={13} className="badge-icon-left" /> Menunggu Otorisasi
          </span>
        );
      case 'Revision':
        return (
          <span className="badge badge-danger">
            <AlertTriangle size={13} className="badge-icon-left" /> Perlu Revisi
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="badge badge-secondary">
            Drafting
          </span>
        );
    }
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
              { id: 'Approved', label: 'Disetujui' },
              { id: 'Revision', label: 'Revisi' },
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
                <option value="cost-desc">Total Biaya Terbesar</option>
                <option value="name-asc">Nama Item (A-Z)</option>
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
        <span className="results-count">
          Menampilkan <strong>{sortedItems.length}</strong> dari {precostings.length} Precosting
        </span>
        <span className="currency-hint">Mata Uang: IDR (Rupiah) • Biaya per Pcs & Semua Qty</span>
      </div>

      {/* Main Table View (Desktop & Responsive Scroll) */}
      <div className={`table-view-wrapper ${viewMode === 'card' ? 'hidden-on-mobile' : ''}`}>
        <div className="table-responsive-container">
          <table className="precosting-table">
            <thead>
              <tr>
                <th className="th-center" style={{ width: '45px' }}>No</th>
                <th style={{ width: '130px' }}>Nomor Precosting</th>
                <th style={{ minWidth: '220px' }}>Nama Item</th>
                <th className="th-right" style={{ minWidth: '135px' }}>
                  Total Harga Fabric<br />
                  <span className="th-sub">per kain (pcs)</span>
                </th>
                <th className="th-right" style={{ minWidth: '135px' }}>
                  Total Harga Acc<br />
                  <span className="th-sub">per kain (pcs)</span>
                </th>
                <th className="th-right" style={{ minWidth: '130px' }}>
                  Total Harga Jasa<br />
                  <span className="th-sub">per kain (pcs)</span>
                </th>
                <th className="th-center" style={{ minWidth: '105px' }}>
                  Target Qty<br />
                  <span className="th-sub">(Pcs)</span>
                </th>
                <th className="th-right" style={{ minWidth: '120px' }}>
                  HPP per Kain<br />
                  <span className="th-sub">(per pcs)</span>
                </th>
                <th className="th-right" style={{ minWidth: '145px' }}>
                  Biaya Semua Qty<br />
                  <span className="th-sub">(Total HPP)</span>
                </th>
                <th className="th-center" style={{ minWidth: '125px' }}>Status</th>
                <th className="th-center" style={{ minWidth: '180px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan="11" className="empty-state-cell">
                    <div className="empty-state">
                      <Layers size={36} className="empty-icon" />
                      <h4>Tidak ada data precosting ditemukan</h4>
                      <p>Coba sesuaikan kata kunci pencarian atau ganti filter status.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedItems.map((item, index) => {
                  const remarksCount = item.remarks ? item.remarks.length : 0;
                  return (
                    <tr key={item.id} className="table-row-hover">
                      <td className="td-center font-mono text-muted">{index + 1}</td>
                      <td className="td-precosting-no font-mono font-bold">
                        <button 
                          className="link-precosting-no"
                          onClick={() => selectPrecosting(item.id)}
                          title="Lihat Detail Item"
                        >
                          {item.precostingNo}
                        </button>
                      </td>
                      <td className="td-item-name">
                        <div className="grid-item-cell">
                          <img 
                            src={item.image || '/images/shirt.jpg'} 
                            alt={item.itemName} 
                            className="grid-item-thumb"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/shirt.jpg';
                            }}
                          />
                          <div>
                            <div className="item-title font-semibold">{item.itemName}</div>
                            <div className="item-meta-sub">
                              <span className="item-category-tag">{item.category}</span>
                              {item.buyer && <span className="item-buyer-name">• {item.buyer}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="td-right font-mono font-medium text-fabric">
                        {formatRupiah(item.fabricCostPerPcs)}
                      </td>
                      <td className="td-right font-mono font-medium text-acc">
                        {formatRupiah(item.accCostPerPcs)}
                      </td>
                      <td className="td-right font-mono font-medium text-jasa">
                        {formatRupiah(item.jasaCostPerPcs)}
                      </td>
                      <td className="td-center font-mono font-semibold">
                        <span className="qty-pill">
                          {formatNumber(item.targetQty)}
                        </span>
                      </td>
                      <td className="td-right font-mono font-semibold text-hpp">
                        {formatRupiah(item.hppPerPcs)}
                      </td>
                      <td className="td-right font-mono font-bold text-total-qty">
                        {formatRupiah(item.hppAllQty)}
                      </td>
                      <td className="td-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="td-center td-actions-cell">
                        <div className="grid-action-buttons">
                          {/* Detail Button */}
                          <button
                            type="button"
                            className="btn-action btn-view-detail"
                            onClick={() => selectPrecosting(item.id)}
                            title="Buka View Detail Precosting"
                          >
                            <Eye size={14} />
                            <span>Detail</span>
                          </button>

                          {/* Remarks Button */}
                          <button
                            type="button"
                            className="btn-action btn-remarks"
                            onClick={() => setRemarksModalItem(item)}
                            title="Beri Catatan / Remarks"
                          >
                            <MessageSquare size={14} />
                            <span>Remarks</span>
                            {remarksCount > 0 && (
                              <span className="remarks-count-pill">{remarksCount}</span>
                            )}
                          </button>

                          {/* Approve Button */}
                          <button
                            type="button"
                            className={`btn-action btn-approve ${item.status === 'Approved' ? 'is-approved' : ''}`}
                            onClick={() => setApprovalModalItem(item)}
                            title="Konfirmasi & Summary Approval"
                          >
                            <CheckCircle size={14} />
                            <span>{item.status === 'Approved' ? 'Disetujui' : 'Approve'}</span>
                          </button>
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
        {sortedItems.length === 0 ? (
          <div className="empty-state mobile-empty">
            <Layers size={36} className="empty-icon" />
            <h4>Tidak ada data precosting</h4>
            <p>Ubah pencarian atau filter status Anda.</p>
          </div>
        ) : (
          sortedItems.map((item, index) => {
            const remarksCount = item.remarks ? item.remarks.length : 0;
            return (
              <div key={item.id} className="mobile-precost-card">
                {/* Card Header */}
                <div className="card-top-row">
                  <img 
                    src={item.image || '/images/shirt.jpg'} 
                    alt={item.itemName} 
                    className="card-thumb-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/shirt.jpg';
                    }}
                  />
                  <div className="card-header-texts">
                    <div className="card-precost-line">
                      <span className="card-no-badge">#{index + 1}</span>
                      <span className="card-precosting-no font-mono">{item.precostingNo}</span>
                    </div>
                    <div 
                      className="card-item-title" 
                      onClick={() => selectPrecosting(item.id)}
                    >
                      {item.itemName}
                    </div>
                    <div className="card-item-category">
                      {item.category} • Buyer: {item.buyer || '-'}
                    </div>
                  </div>
                  <div className="card-status-wrapper">
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Three Costs Breakdown (Fabric, Acc, Jasa) */}
                <div className="card-costs-grid">
                  <div className="card-cost-box fabric-box">
                    <span className="box-label">Fabric / Pcs</span>
                    <span className="box-val">{formatRupiah(item.fabricCostPerPcs)}</span>
                  </div>
                  <div className="card-cost-box acc-box">
                    <span className="box-label">Acc / Pcs</span>
                    <span className="box-val">{formatRupiah(item.accCostPerPcs)}</span>
                  </div>
                  <div className="card-cost-box jasa-box">
                    <span className="box-label">Jasa / Pcs</span>
                    <span className="box-val">{formatRupiah(item.jasaCostPerPcs)}</span>
                  </div>
                </div>

                {/* Production Total Info */}
                <div className="card-summary-strip">
                  <div className="summary-strip-item">
                    <span className="strip-label">Target Qty:</span>
                    <span className="strip-value font-mono">{formatNumber(item.targetQty)} Pcs</span>
                  </div>
                  <div className="summary-strip-item text-right">
                    <span className="strip-label">Biaya Semua Qty:</span>
                    <span className="strip-value font-bold text-total-qty font-mono">
                      {formatRupiah(item.hppAllQty)}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="card-actions-row">
                  <button
                    type="button"
                    className="card-btn btn-view-detail"
                    onClick={() => selectPrecosting(item.id)}
                  >
                    <Eye size={15} />
                    <span>Lihat Detail</span>
                  </button>

                  <button
                    type="button"
                    className="card-btn btn-remarks"
                    onClick={() => setRemarksModalItem(item)}
                  >
                    <MessageSquare size={15} />
                    <span>Remarks {remarksCount > 0 ? `(${remarksCount})` : ''}</span>
                  </button>

                  <button
                    type="button"
                    className={`card-btn btn-approve ${item.status === 'Approved' ? 'is-approved' : ''}`}
                    onClick={() => setApprovalModalItem(item)}
                  >
                    <CheckCircle size={15} />
                    <span>{item.status === 'Approved' ? 'Summary' : 'Approve'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
