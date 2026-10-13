import React, { useState } from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { Scissors, User, Lock, Eye, EyeOff, UserCheck, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login } = usePrecosting();

  const [username, setUsername] = useState('rina.kartika');
  const [password, setPassword] = useState('costing123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const demoAccounts = [
    {
      label: 'Merchandiser (Rina)',
      name: 'Rina Kartika',
      username: 'rina.kartika',
      role: 'Merchandiser Lead',
    },
    {
      label: 'Costing Eng. (Hendra)',
      name: 'Hendra Saputra',
      username: 'hendra.saputra',
      role: 'Costing Specialist',
    },
    {
      label: 'Approver (Budi)',
      name: 'Budi Santoso',
      username: 'budi.santoso',
      role: 'Approver',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    const matched = demoAccounts.find(
      (a) => a.username.toLowerCase() === username.trim().toLowerCase()
    );

    login({
      id: `usr-${Date.now()}`,
      name: matched ? matched.name : username.trim(),
      username: username.trim(),
      role: matched ? matched.role : 'Merchandiser',
    });
  };

  const handleSelectDemo = (acc) => {
    setUsername(acc.username);
    setPassword('costing123');
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

        {/* Login Form with Styled Inputs */}
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
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                autoComplete="username"
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
              <button 
                type="button" 
                className="link-forgot-pass"
                onClick={() => alert('Password demo: costing123')}
                tabIndex={-1}
              >
                Lupa password?
              </button>
            </div>
            <div className="field-input-row">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="stylish-clean-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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
              />
              <span>Ingat saya di perangkat ini</span>
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-simple-submit">
            <span>Masuk ke Sistem</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Clean Demo Role Switcher */}
        <div className="simple-demo-section">
          <div className="simple-demo-label">
            <UserCheck size={14} />
            <span>Pilih akun demo cepat:</span>
          </div>
          <div className="simple-demo-pills">
            {demoAccounts.map((acc) => {
              const isActive = username.toLowerCase() === acc.username.toLowerCase();
              return (
                <button
                  key={acc.username}
                  type="button"
                  className={`simple-demo-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleSelectDemo(acc)}
                  title={`Login sebagai ${acc.role} (${acc.username})`}
                >
                  <span className="pill-username">{acc.username}</span>
                  <span className="pill-role">{acc.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="simple-login-footer">
          <span>Cloth Precosting Portal v1.0 • Internal Production ERP</span>
        </div>
      </div>
    </div>
  );
};
