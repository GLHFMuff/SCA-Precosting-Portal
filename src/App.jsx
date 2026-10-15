import React, { useState } from 'react';
import { usePrecosting } from './context/PrecostingContext';
import { Header } from './components/layout/Header';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { Login } from './components/auth/Login';
import { SummaryStats } from './components/dashboard/SummaryStats';
import { PrecostingGrid } from './components/dashboard/PrecostingGrid';
import { PrecostingDetail } from './components/detail/PrecostingDetail';
import { ApprovalModal } from './components/modals/ApprovalModal';
import { RemarksModal } from './components/modals/RemarksModal';
import { Toast } from './components/common/Toast';
import './App.css';

function MainPortal() {
  const { user, selectedPrecosting } = usePrecosting();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />

      {/* Mobile Navigation Drawer for HP */}
      <MobileDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Main Content Area */}
      <main className="main-content-wrapper">
        <div className="main-content-container">
          {selectedPrecosting ? (
            /* View Detail Page */
            <PrecostingDetail />
          ) : (
            /* Initial Grid Dashboard View */
            <div className="dashboard-view-fade-in">
              {/* Top KPI Metrics Overview */}
              <SummaryStats />

              {/* Main Precosting Grid */}
              <PrecostingGrid />
            </div>
          )}
        </div>
      </main>

      {/* Modals & Popups */}
      <ApprovalModal />
      <RemarksModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return <MainPortal />;
}
