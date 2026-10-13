import React, { useState } from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { X, MessageSquare, Send, User, Clock } from 'lucide-react';

export const RemarksModal = () => {
  const { 
    remarksModalItem, 
    setRemarksModalItem, 
    addRemark, 
    user 
  } = usePrecosting();

  const [text, setText] = useState('');

  if (!remarksModalItem) return null;

  const item = remarksModalItem;
  const remarks = item.remarks || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addRemark(item.id, text);
    setText('');
  };

  return (
    <div className="modal-overlay" onClick={() => setRemarksModalItem(null)}>
      <div className="modal-container remarks-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-icon-badge info-badge">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="modal-title">Catatan & Remarks Precosting</h3>
              <p className="modal-subtitle">
                {item.precostingNo} — {item.itemName}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={() => setRemarksModalItem(null)}
            aria-label="Tutup popup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Add Remark Form */}
          <form onSubmit={handleSubmit} className="remarks-modal-form">
            <label className="form-label font-semibold">
              Tambah Catatan Baru:
            </label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Tuliskan catatan teknis kain, toleransi shrinkage, instruksi CMT, atau catatan negosiasi buyer..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
            <div className="remarks-modal-submit-row">
              <span className="author-indicator">
                Penulis: <strong>{user ? `${user.name} (${user.role})` : 'User'}</strong>
              </span>
              <button 
                type="submit" 
                className="btn-submit-remark"
                disabled={!text.trim()}
              >
                <Send size={15} />
                <span>Simpan Remark</span>
              </button>
            </div>
          </form>

          {/* Remarks History */}
          <div className="modal-remarks-list">
            <h4 className="remarks-list-title">
              Riwayat Catatan ({remarks.length})
            </h4>

            {remarks.length === 0 ? (
              <div className="no-remarks-box">
                Belum ada catatan untuk nomor precosting ini. Tulis catatan pertama pada form di atas.
              </div>
            ) : (
              <div className="remarks-scroll-area">
                {remarks.map((rem) => (
                  <div key={rem.id} className="modal-remark-card">
                    <div className="modal-remark-top">
                      <div className="modal-remark-author">
                        <User size={13} className="text-secondary" />
                        <span className="name">{rem.author}</span>
                        {rem.role && <span className="role-tag">{rem.role}</span>}
                      </div>
                      <div className="modal-remark-time">
                        <Clock size={12} />
                        <span>{rem.timestamp}</span>
                      </div>
                    </div>
                    <div className="modal-remark-text">
                      {rem.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-modal-cancel" 
            onClick={() => setRemarksModalItem(null)}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
