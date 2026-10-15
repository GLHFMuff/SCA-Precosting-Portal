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
  const pendingCount = precostings.filter((p) => p.status === 'Pending Approval').length;
  const approvedCount = precostings.filter((p) => p.status === 'Approved').length;
  const revisionCount = precostings.filter((p) => p.status === 'Revision').length;

  const totalTargetQty = precostings.reduce(
    (sum, p) => sum + (Number(p.targetQty) || 0),
    0
  );

  const totalProductionValue = precostings.reduce(
    (sum, p) => sum + (Number(p.hppAllQty) || 0),
    0
  );

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

      {/* Pending Approval Card */}
      <div 
        className={`stat-compact-card warning-card ${statusFilter === 'Pending Approval' ? 'active-filter' : ''}`}
        onClick={() => setStatusFilter(statusFilter === 'Pending Approval' ? 'ALL' : 'Pending Approval')}
        role="button"
        tabIndex={0}
        title="Klik untuk filter: Menunggu Approval"
      >
        <div className="stat-compact-icon warning">
          <Clock size={16} />
        </div>
        <div className="stat-compact-body">
          <span className="stat-compact-title">Menunggu Approval</span>
          <div className="stat-compact-val text-amber">
            {pendingCount} <span className="stat-compact-unit">Model</span>
          </div>
        </div>
      </div>

      {/* Approved Card */}
      <div 
        className={`stat-compact-card success-card ${statusFilter === 'Approved' ? 'active-filter' : ''}`}
        onClick={() => setStatusFilter(statusFilter === 'Approved' ? 'ALL' : 'Approved')}
        role="button"
        tabIndex={0}
        title="Klik untuk filter: Sudah Disetujui"
      >
        <div className="stat-compact-icon success">
          <CheckCircle2 size={16} />
        </div>
        <div className="stat-compact-body">
          <span className="stat-compact-title">Sudah Disetujui</span>
          <div className="stat-compact-val text-emerald">
            {approvedCount} <span className="stat-compact-unit">Model</span>
          </div>
        </div>
      </div>

      {/* Target Qty Card */}
      <div 
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
      </div>

      {/* Total Production Cost / HPP Value */}
      <div 
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
      </div>
    </div>
  );
};
