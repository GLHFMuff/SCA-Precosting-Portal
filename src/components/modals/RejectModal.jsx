import React, { useState } from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { formatNumber } from '../../utils/formatters';
import { decodeBase64Image } from '../../utils/imageUtils';
import { 
  X, 
  XCircle, 
  AlertTriangle, 
  UserX 
} from 'lucide-react';

export const RejectModal = () => {
  const { 
    rejectModalItem, 
    setRejectModalItem, 
    setApprovalModalItem,
    rejectPrecosting, 
    user 
  } = usePrecosting();

  const [remarks, setRemarks] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!rejectModalItem) return null;

  const item = rejectModalItem;
  const isAlreadyDecided = 
    item.status?.toLowerCase() === 'confirmed' || 
    item.status?.toLowerCase() === 'approved' ||
    item.status?.toLowerCase() === 'reject' || 
    item.status?.toLowerCase() === 'rejected';

  const handleClose = () => {
    setRemarks('');
    setErrorMessage('');
    setRejectModalItem(null);
  };

  const handleConfirmReject = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isAlreadyDecided) {
      setErrorMessage('Precosting sudah berstatus ' + item.status + ' dan tidak dapat diubah lagi.');
      return;
    }
    if (!remarks.trim()) {
      setErrorMessage('Catatan / remarks alasan penolakan wajib diisi!');
      return;
    }

    const success = await rejectPrecosting(item.id, remarks.trim());
    if (success) {
      if (setApprovalModalItem) setApprovalModalItem(null);
      handleClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container reject-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-icon-badge danger-badge">
              <XCircle size={22} />
            </div>
            <div>
              <h3 className="modal-title">Konfirmasi Tolak (Rejected) Precosting</h3>
              <p className="modal-subtitle">
                Status akan diubah menjadi Rejected. Wajib menyertakan catatan alasan penolakan.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={handleClose}
            aria-label="Tutup popup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Target Item Header Strip */}
          <div className="modal-item-strip reject-item-strip">
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
                  Buyer: <strong>{item.buyer || '-'}</strong> • Target: <strong>{formatNumber(item.targetQty)} Pcs</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Box Warning */}
          <div className="reject-alert-banner">
            <AlertTriangle size={18} className="reject-alert-icon" />
            <div className="reject-alert-text">
              Tindakan ini akan mengupdate status Precosting menjadi <strong>"Rejected"</strong>. 
              Merchandiser / Tim Costing akan menerima catatan penolakan ini untuk evaluasi dan tindak lanjut.
            </div>
          </div>

          {/* Mandatory Remarks Textarea Form */}
          <div className="approval-remarks-group reject-remarks-group">
            <label className="form-label font-semibold">
              <span className="text-rose-600 font-bold">*</span>
              <span>Alasan Penolakan / Catatan Remarks (Wajib Diisi):</span>
            </label>
            <textarea
              className={`form-textarea reject-textarea ${errorMessage ? 'has-error' : ''}`}
              rows="4"
              placeholder="Contoh: Total Fabric melebihi batas budget buyer Rp 11.000, konsumsi kain 1.10 masih terlalu boros, perlu revisi penawaran harga CMT..."
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (errorMessage && e.target.value.trim()) {
                  setErrorMessage('');
                }
              }}
              autoFocus
              required
            />

            {errorMessage && (
              <div className="reject-error-hint">
                <AlertTriangle size={13} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="form-input-hint">
              <span className="hint-user-info">
                <UserX size={13} className="text-rose-600" />
                <span>Direview oleh: <strong>{user ? `${user.name} (${user.role})` : 'Authorized Reviewer'}</strong></span>
              </span>
              <span className="hint-char-count font-mono">{remarks.length} karakter</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-modal-cancel" 
            onClick={handleClose}
          >
            Batal
          </button>

          <button 
            type="button" 
            className="btn-modal-confirm-reject"
            onClick={handleConfirmReject}
            disabled={!remarks.trim() || isAlreadyDecided}
            title={isAlreadyDecided ? 'Precosting sudah diproses sebelumnya' : (!remarks.trim() ? 'Isi remarks terlebih dahulu' : 'Konfirmasi Tolak (Reject)')}
          >
            <XCircle size={16} />
            <span>Konfirmasi Reject</span>
          </button>
        </div>
      </div>
    </div>
  );
};
