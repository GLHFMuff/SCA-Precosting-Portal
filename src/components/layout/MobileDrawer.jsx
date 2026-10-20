import React from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { 
  Grid, 
  ShieldCheck, 
  LogOut, 
  X,
  FileSpreadsheet
} from 'lucide-react';

export const MobileDrawer = ({ isOpen, onClose }) => {
  const { 
    user, 
    logout, 
    clearSelectedPrecosting, 
    statusFilter, 
    setStatusFilter,
    precostings 
  } = usePrecosting();

  if (!isOpen) return null;

  const pendingCount = precostings.filter(p => {
    const s = (p.status || '').toLowerCase().trim();
    return s === 'pending' || s === 'pending approval';
  }).length;
  const approvedCount = precostings.filter(p => {
    const s = (p.status || '').toLowerCase().trim();
    return s === 'confirmed' || s === 'approved' || s === 'confirm';
  }).length;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <strong>PRECOSTEX</strong> Menu
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="drawer-user-card">
            <div className="drawer-avatar">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="drawer-user-name">{user.name}</div>
              <div className="drawer-user-role">{user.role} ({user.email || user.username})</div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <div className="drawer-nav">
          <button 
            className="drawer-nav-item"
            onClick={() => {
              clearSelectedPrecosting();
              setStatusFilter('ALL');
              onClose();
            }}
          >
            <Grid size={18} />
            <span>Semua Precosting Grid</span>
          </button>

          <button 
            className="drawer-nav-item"
            onClick={() => {
              clearSelectedPrecosting();
              setStatusFilter('Pending');
              onClose();
            }}
          >
            <ShieldCheck size={18} />
            <span>Pending ({pendingCount})</span>
          </button>

          <button 
            className="drawer-nav-item"
            onClick={() => {
              clearSelectedPrecosting();
              setStatusFilter('Confirmed');
              onClose();
            }}
          >
            <FileSpreadsheet size={18} />
            <span>Confirmed ({approvedCount})</span>
          </button>
        </div>

        <div className="drawer-divider" />

        <div className="drawer-footer">
          <button 
            className="drawer-btn-danger"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            <LogOut size={16} />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
