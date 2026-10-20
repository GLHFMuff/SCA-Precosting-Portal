import React from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import {
  Layers,
  Clock,
  CheckCircle2,
  Package,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const SummaryStats = () => {
  const { precostings, statusFilter, setStatusFilter } = usePrecosting();

  const totalCount = precostings.length;
  const pendingCount = precostings.filter((p) => {
    const s = (p.status || '').toLowerCase().trim();
    return s === 'pending' || s === 'pending approval';
  }).length;
  const approvedCount = precostings.filter((p) => {
    const s = (p.status || '').toLowerCase().trim();
    return s === 'confirmed' || s === 'approved' || s === 'confirm';
  }).length;
  const rejectCount = precostings.filter((p) => {
    const s = (p.status || '').toLowerCase().trim();
    return s === 'rejected' || s === 'reject' || s === 'revision';
  }).length;

  const totalTargetQty = precostings.reduce(
    (sum, p) => sum + (Number(p.targetQty) || 0),
    0
  );

  const totalProductionValue = precostings.reduce(
    (sum, p) => sum + (Number(p.hppAllQty) || 0),
    0
  );

  const isPendingFilter = statusFilter.toLowerCase() === 'pending' || statusFilter === 'Pending Approval';
  const isConfirmedFilter = statusFilter.toLowerCase() === 'confirmed' || statusFilter === 'Approved';

  return (
    <div className="summary-stats-compact-row">
      {/* Total Precosting Card */}
      <div
        className={`stat-compact-card ${statusFilter === 'ALL' ? 'active-filter' : ''}`}
        onClick={() => setStatusFilter('ALL')}
        role="button"
        tabIndex={0}
        title="Klik untuk melihat semua precosting"
      >
        <div className="stat-compact-icon info">
          <Layers size={16} />
        </div>
        <div className="stat-compact-body">
          <span className="stat-compact-title">Total Precosting</span>
          <div className="stat-compact-val">
            {totalCount} <span className="stat-compact-unit">Item</span>
          </div>
        </div>
      </div>

      {/* Pending Card */}
      <div
        className={`stat-compact-card warning-card ${isPendingFilter ? 'active-filter' : ''}`}
        onClick={() => setStatusFilter(isPendingFilter ? 'ALL' : 'Pending')}
        role="button"
        tabIndex={0}
        title="Klik untuk filter: Pending"
      >
        <div className="stat-compact-icon warning">
          <Clock size={16} />
        </div>
        <div className="stat-compact-body">
          <span className="stat-compact-title">Pending</span>
          <div className="stat-compact-val text-amber">
            {pendingCount} <span className="stat-compact-unit">Model</span>
          </div>
        </div>
      </div>

      {/* Confirmed Card */}
      <div
        className={`stat-compact-card success-card ${isConfirmedFilter ? 'active-filter' : ''}`}
        onClick={() => setStatusFilter(isConfirmedFilter ? 'ALL' : 'Confirmed')}
        role="button"
        tabIndex={0}
        title="Klik untuk filter: Confirmed"
      >
        <div className="stat-compact-icon success">
          <CheckCircle2 size={16} />
        </div>
        <div className="stat-compact-body">
          <span className="stat-compact-title">Confirmed</span>
          <div className="stat-compact-val text-emerald">
            {approvedCount} <span className="stat-compact-unit">Model</span>
          </div>
        </div>
      </div>

      {/* Target Qty Card */}
      {/* <div 
        className="stat-compact-card"
        title="Total akumulasi kuantitas produksi"
      >
        <div className="stat-compact-icon purple">
          <Package size={16} />
        </div>
        <div className="stat-compact-body">
          <span className="stat-compact-title">Target Qty Produksi</span>
          <div className="stat-compact-val font-mono">
            {formatNumber(totalTargetQty)} <span className="stat-compact-unit">Pcs</span>
          </div>
        </div>
      </div> */}

      {/* Total Production Cost / HPP Value */}
      {/* <div 
        className="stat-compact-card highlight-card"
        title="Total estimasi biaya modal produksi (HPP)"
      >
        <div className="stat-compact-icon primary">
          <TrendingUp size={16} />
        </div>
        <div className="stat-compact-body">
          <span className="stat-compact-title">Total Estimasi HPP</span>
          <div className="stat-compact-val font-mono text-primary-gradient">
            {formatRupiah(totalProductionValue)}
          </div>
        </div>
      </div> */}
    </div>
  );
};
