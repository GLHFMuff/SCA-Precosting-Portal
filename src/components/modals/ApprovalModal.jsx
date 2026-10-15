import React, { useState } from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { decodeBase64Image } from '../../utils/imageUtils';
import { 
  X, 
  CheckCircle, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Scissors, 
  Package, 
  Layers, 
  DollarSign, 
  TrendingUp 
} from 'lucide-react';

export const ApprovalModal = () => {
  const { 
    approvalModalItem, 
    setApprovalModalItem, 
    approvePrecosting, 
    rejectPrecosting, 
    user 
  } = usePrecosting();

  const [approvalNotes, setApprovalNotes] = useState('');
  const [activeAction, setActiveAction] = useState(null); // 'approve' | 'reject'

  if (!approvalModalItem) return null;

  const item = approvalModalItem;
  const isAlreadyApproved = item.status === 'Approved';

  const handleApprove = () => {
    approvePrecosting(item.id, approvalNotes);
    setApprovalModalItem(null);
  };

  const handleReject = () => {
    if (!approvalNotes.trim()) {
      alert('Mohon cantumkan alasan atau poin revisi di kolom catatan.');
      return;
    }
    rejectPrecosting(item.id, approvalNotes);
    setApprovalModalItem(null);
  };

  return (
    <div className="modal-overlay" onClick={() => setApprovalModalItem(null)}>
      <div className="modal-container approval-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-icon-badge success-badge">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="modal-title">Konfirmasi & Ringkasan Otorisasi Precosting</h3>
              <p className="modal-subtitle">
                Review ringkasan biaya (Fabric, Acc, Jasa, COGM, HPP) sebelum memberi persetujuan final.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={() => setApprovalModalItem(null)}
            aria-label="Tutup popup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Target Item Header Strip with Garment Image */}
          <div className="modal-item-strip">
            <div className="modal-item-strip-left">
              <img 
                src={decodeBase64Image(item.image)} 
                alt={item.itemName} 
                className="modal-item-thumb"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/shirt.jpg';
                }}
              />
              <div>
                <span className="strip-precost-no font-mono">{item.precostingNo}</span>
                <h4 className="strip-item-title">{item.itemName}</h4>
                <div className="strip-meta-line">
                  Buyer: <strong>{item.buyer || '-'}</strong> • Kategori: <strong>{item.category}</strong>
                </div>
              </div>
            </div>
            <div className="strip-qty-box">
              <span className="qty-box-label">Target Qty:</span>
              <span className="qty-box-val font-mono">{formatNumber(item.targetQty)} Pcs</span>
            </div>
          </div>

          {/* Financial Costing Summary Window */}
          <div className="approval-summary-window">
            <div className="summary-window-header">
              <span className="window-header-title">
                <FileText size={15} /> RINGKASAN BIAYA & STRUKTUR HPP
              </span>
              <span className="window-header-sub font-mono">
                Batch: {formatNumber(item.targetQty)} {item.unit || 'Pcs'}
              </span>
            </div>

            <div className="summary-metrics-table">
              <div className="summary-row">
                <div className="summary-col-name">
                  <Scissors size={14} className="icon-sub text-fabric" />
                  <span>Total Harga Fabric (Kain Utama & Interlining):</span>
                </div>
                <div className="summary-col-pcs font-mono font-medium text-fabric">
                  {formatRupiah(item.fabricCostPerPcs)} <span className="unit-sub">/ pcs</span>
                </div>
                <div className="summary-col-all font-mono">
                  {formatRupiah(item.totalFabricCostAllQty)}
                </div>
              </div>

              <div className="summary-row">
                <div className="summary-col-name">
                  <Package size={14} className="icon-sub text-acc" />
                  <span>Total Harga Accessories (Trims, Label & Pack):</span>
                </div>
                <div className="summary-col-pcs font-mono font-medium text-acc">
                  {formatRupiah(item.accCostPerPcs)} <span className="unit-sub">/ pcs</span>
                </div>
                <div className="summary-col-all font-mono">
                  {formatRupiah(item.totalAccCostAllQty)}
                </div>
              </div>

              <div className="summary-row">
                <div className="summary-col-name">
                  <Layers size={14} className="icon-sub text-jasa" />
                  <span>Total Harga Jasa (CMT Jahit, Cut, Wash & Overhead):</span>
                </div>
                <div className="summary-col-pcs font-mono font-medium text-jasa">
                  {formatRupiah(item.jasaCostPerPcs)} <span className="unit-sub">/ pcs</span>
                </div>
                <div className="summary-col-all font-mono">
                  {formatRupiah(item.totalJasaCostAllQty)}
                </div>
              </div>

              <div className="summary-row row-divider" />

              <div className="summary-row highlight-sub-row">
                <div className="summary-col-name font-semibold text-purple">
                  <span>COGM (Biaya Pokok Produksi Pabrik):</span>
                </div>
                <div className="summary-col-pcs font-mono font-bold text-purple">
                  {formatRupiah(item.cogmPerPcs)} <span className="unit-sub">/ pcs</span>
                </div>
                <div className="summary-col-all font-mono font-bold text-purple">
                  {formatRupiah(item.cogmAllQty)}
                </div>
              </div>

              <div className="summary-row">
                <div className="summary-col-name text-muted">
                  <span>Buffer Penyusutan & Handling Ekspedisi (2.5%):</span>
                </div>
                <div className="summary-col-pcs font-mono text-muted">
                  {formatRupiah(item.bufferPerPcs)} <span className="unit-sub">/ pcs</span>
                </div>
                <div className="summary-col-all font-mono text-muted">
                  {formatRupiah(item.bufferAllQty)}
                </div>
              </div>

              <div className="summary-row row-grand-total">
                <div className="summary-col-name font-bold text-emerald">
                  <TrendingUp size={16} />
                  <span>FINAL HPP / COGS (Total Modal Produksi):</span>
                </div>
                <div className="summary-col-pcs font-mono font-bold text-emerald text-lg">
                  {formatRupiah(item.hppPerPcs)} <span className="unit-sub">/ pcs</span>
                </div>
                <div className="summary-col-all font-mono font-bold text-emerald text-lg">
                  {formatRupiah(item.hppAllQty)}
                </div>
              </div>
            </div>

            {/* Target Selling & Margin Note */}
            <div className="summary-window-footer font-mono">
              <span>Target FOB Rekomendasi: <strong>{formatRupiah(item.targetSellingPricePerPcs)}/pcs</strong></span>
              <span>• Proyeksi Gross Margin: <strong>{formatRupiah(item.totalProfitAllQty)}</strong> (30%)</span>
            </div>
          </div>

          {/* Current Status Badge if already approved */}
          {isAlreadyApproved && (
            <div className="already-approved-note">
              <CheckCircle size={16} className="text-emerald" />
              <span>
                Precosting ini <strong>sudah berstatus Disetujui</strong> sebelumnya oleh {item.approvedBy || 'Manager'}.
                Anda dapat memperbarui catatan approval atau mengonfirmasi ulang.
              </span>
            </div>
          )}

          {/* Remarks & Approval Note Input */}
          <div className="form-group approval-remarks-group">
            <label className="form-label font-semibold">
              Catatan Approval / Catatan Revisi:
            </label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Tuliskan catatan otorisasi (contoh: Disetujui dengan batas toleransi kain 2%, target delivery wajib dipatuhi...)"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
            />
            <div className="form-input-hint">
              Otorisasi oleh: <strong>{user ? `${user.name} (${user.role})` : 'Authorized Approver'}</strong>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-modal-cancel" 
            onClick={() => setApprovalModalItem(null)}
          >
            Batal
          </button>

          <button 
            type="button" 
            className="btn-modal-revision"
            onClick={handleReject}
            title="Kirim status Revisi ke Merchandiser"
          >
            <AlertTriangle size={15} />
            <span>Minta Revisi</span>
          </button>

          <button 
            type="button" 
            className="btn-modal-confirm-approve"
            onClick={handleApprove}
          >
            <CheckCircle size={16} />
            <span>Konfirmasi & Approve</span>
          </button>
        </div>
      </div>
    </div>
  );
};
