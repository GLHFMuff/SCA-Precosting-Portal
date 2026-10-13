import React from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { 
  Scissors, 
  Layers, 
  PlusCircle, 
  LogOut, 
  User, 
  ShieldCheck, 
  RotateCcw,
  Menu,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const Header = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { 
    user, 
    logout, 
    selectedPrecosting, 
    clearSelectedPrecosting, 
    setIsNewModalOpen,
    resetToDefaultData 
  } = usePrecosting();

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand Logo & Title */}
        <div className="brand-section">
          <button 
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="brand-logo" onClick={clearSelectedPrecosting} style={{ cursor: 'pointer' }}>
            <div className="logo-icon-wrapper">
              <Scissors className="logo-icon" size={20} />
            </div>
            <div className="brand-texts">
              <div className="brand-title">
                PRECOST<span className="brand-highlight">EX</span>
              </div>
              <div className="brand-subtitle">Cloth & Garment Precosting Portal</div>
            </div>
          </div>
        </div>

        {/* Center Breadcrumb or Status */}
        <div className="header-center">
          {selectedPrecosting ? (
            <div className="breadcrumb-pill">
              <button onClick={clearSelectedPrecosting} className="breadcrumb-link">
                Dashboard Grid
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {selectedPrecosting.precostingNo}
              </span>
            </div>
          ) : (
            <div className="portal-badge">
              <Layers size={14} className="badge-icon" />
              <span>COGS • COGM • HPP Management System</span>
            </div>
          )}
        </div>

        {/* Right Action Tools & User Profile */}
        <div className="header-actions">
          <button 
            type="button"
            className="btn-header-secondary" 
            onClick={() => setIsNewModalOpen(true)}
            title="Buat Precosting Baru"
          >
            <PlusCircle size={16} />
            <span className="btn-text">Tambah Precosting</span>
          </button>

          <button 
            type="button"
            className="btn-header-ghost" 
            onClick={resetToDefaultData}
            title="Reset ke Sampel Awal Pabrik"
          >
            <RotateCcw size={15} />
            <span className="btn-text-desktop">Reset Sampel</span>
          </button>

          {/* User profile dropdown / info */}
          {user && (
            <div className="user-profile-badge">
              <div className="avatar-circle">
                {user.role === 'Approver' ? (
                  <ShieldCheck size={16} className="avatar-role-icon" />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="user-info-text">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>

              <button 
                type="button"
                className="btn-logout" 
                onClick={logout}
                title="Keluar / Logout"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
