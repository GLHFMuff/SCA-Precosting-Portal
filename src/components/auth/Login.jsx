import React, { useState } from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { precostingApi } from '../../services/api';
import {
  Scissors,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Terminal,
  AlertCircle,
  Database,
  Loader2,
  KeyRound,
} from 'lucide-react';

export const Login = () => {
  const { login } = usePrecosting();

  const [username, setUsername] = useState(() => {
    return localStorage.getItem('cloth_saved_username') || 'management';
  });
  const [password, setPassword] = useState('.dma01');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2 Official User Accounts (Stored in PostgreSQL Database)
  const registeredAccounts = [
    {
      id: 'usr-mgmt',
      badge: 'Management',
      username: 'management',
      password: '.dma01',
      name: 'Management',
      role: 'Management',
      type: 'management',
      icon: ShieldCheck,
      tooltip: 'Otorisasi & Approval Precosting',
    },
    {
      id: 'usr-dev',
      badge: 'Akun Developer',
      username: 'developer',
      password: 'dev123',
      name: 'Lead Developer',
      role: 'System Administrator',
      type: 'developer',
      icon: Terminal,
      tooltip: 'Akses Penuh Sistem & Konfigurasi',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Harap masukkan username.');
      return;
    }
    if (!password) {
      setErrorMessage('Harap masukkan password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await precostingApi.login(username.trim(), password);
      if (res && res.success && res.data) {
        if (rememberMe) {
          localStorage.setItem('cloth_saved_username', username.trim());
        } else {
          localStorage.removeItem('cloth_saved_username');
        }
        login(res.data);
      } else {
        setErrorMessage(res?.message || 'Username atau password salah.');
      }
    } catch (err) {
      setErrorMessage(
        err.message || 'Gagal login. Periksa koneksi ke server PostgreSQL database.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setErrorMessage('');
  };

  return (
    <div className="simple-login-wrapper">
      <div className="simple-login-card">
        {/* Brand Header */}
        <div className="simple-login-header">
          <div className="simple-brand-icon">
            <Scissors size={22} />
          </div>
          <h1 className="simple-login-title">Cloth Precosting Portal</h1>
          <p className="simple-login-subtitle">
            Masuk untuk mengelola costing kain, CMT, dan otorisasi HPP
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="login-alert-error" role="alert">
            <AlertCircle size={16} className="login-alert-icon" />
            <div className="login-alert-content">
              <strong>Gagal Masuk:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="simple-login-form">
          {/* Styled Username Field */}
          <div className="stylish-field-container">
            <div className="field-micro-header">
              <span className="field-micro-label">
                <User size={13} className="micro-icon" />
                Username
              </span>
              <span className="field-helper-tag">Wajib diisi</span>
            </div>
            <div className="field-input-row">
              <input
                id="login-username"
                type="text"
                className="stylish-clean-input"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Masukkan username"
                autoComplete="username"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Styled Password Field */}
          <div className="stylish-field-container">
            <div className="field-micro-header">
              <span className="field-micro-label">
                <Lock size={13} className="micro-icon" />
                Password
              </span>
              {/* <button
                type="button"
                className="link-forgot-pass"
                onClick={() =>
                  alert('Password akun:\n• Bos Besar (direktur): direktur123\n• Developer (developer): dev123')
                }
                tabIndex={-1}
              >
                Bantuan password?
              </button> */}
            </div>
            <div className="field-input-row">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="stylish-clean-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Options Row */}
          <div className="form-options-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="stylish-checkbox"
                disabled={isLoading}
              />
              <span>Ingat username saya</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-simple-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Memverifikasi Database...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Clean Database User Switcher */}
        {/* <div className="simple-demo-section">
          <div className="simple-demo-label">
            <KeyRound size={13} />
            <span>Pilih akun tersimpan (2 User Database):</span>
          </div>
          <div className="simple-demo-pills">
            {registeredAccounts.map((acc) => {
              const isActive =
                username.trim().toLowerCase() === acc.username.toLowerCase();
              const IconComponent = acc.icon;
              return (
                <button
                  key={acc.id}
                  type="button"
                  className={`simple-demo-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleSelectAccount(acc)}
                  disabled={isLoading}
                  title={`Pilih ${acc.name} (${acc.role})`}
                >
                  <div className="pill-left">
                    <div className={`pill-avatar-icon is-${acc.type}`}>
                      <IconComponent size={16} />
                    </div>
                    <div className="pill-text-group">
                      <span className="pill-person-name">{acc.name}</span>
                      <span className="pill-person-role">
                        {acc.role} • <em>{acc.badge}</em>
                      </span>
                    </div>
                  </div>
                  <span className="pill-badge-tag">{acc.username}</span>
                </button>
              );
            })}
          </div>
        </div> */}

        {/* Footer */}
        <div className="simple-login-footer">
          <span>Cloth Precosting Portal v1.0 • Internal Production ERP</span>
        </div>
      </div>
    </div>
  );
};

