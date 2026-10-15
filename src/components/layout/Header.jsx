import React from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import {
  Scissors,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X,
  Database
} from 'lucide-react';

export const Header = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const {
    user,
    logout,
    selectedPrecosting,
    clearSelectedPrecosting,
    isBackendOnline,
    dbInfo
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


        {/* Right Action Tools & User Profile */}
        <div className="header-actions">
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
