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
    <div className="summary-stats-grid">
      {/* Total Precosting Card */}
      <div 
        className={`stat-card ${statusFilter === 'ALL' ? 'active-filter' : ''}`}
        onClick={() => setStatusFilter('ALL')}
        role="button"
        tabIndex={0}
      >
        <div className="stat-card-header">
          <span className="stat-card-title">Total Precosting</span>
          <div className="stat-icon-wrapper info">
            <Layers size={18} />
          </div>
        </div>
        <div className="stat-card-value">{totalCount}</div>
        <div className="stat-card-desc">Semua data model pakaian</div>
      </div>

      {/* Pending Approval Card */}
      <div 
        className={`stat-card warning-card ${statusFilter === 'Pending Approval' ? 'active-filter' : ''}`}
        onClick={() => setStatusFilter(statusFilter === 'Pending Approval' ? 'ALL' : 'Pending Approval')}
        role="button"
        tabIndex={0}
      >
        <div className="stat-card-header">
          <span className="stat-card-title">Menunggu Approval</span>
          <div className="stat-icon-wrapper warning">
            <Clock size={18} />
          </div>
        </div>
        <div className="stat-card-value text-amber">{pendingCount}</div>
        <div className="stat-card-desc">Butuh tinjauan & otorisasi</div>
      </div>

      {/* Approved Card */}
      <div 
        className={`stat-card success-card ${statusFilter === 'Approved' ? 'active-filter' : ''}`}
        onClick={() => setStatusFilter(statusFilter === 'Approved' ? 'ALL' : 'Approved')}
        role="button"
        tabIndex={0}
      >
        <div className="stat-card-header">
          <span className="stat-card-title">Sudah Disetujui</span>
          <div className="stat-icon-wrapper success">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="stat-card-value text-emerald">{approvedCount}</div>
        <div className="stat-card-desc">Siap rilis ke order produksi</div>
      </div>

      {/* Target Qty Card */}
      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Target Qty Produksi</span>
          <div className="stat-icon-wrapper purple">
            <Package size={18} />
          </div>
        </div>
        <div className="stat-card-value">{formatNumber(totalTargetQty)} <span className="stat-unit">Pcs</span></div>
        <div className="stat-card-desc">Akumulasi seluruh batch order</div>
      </div>

      {/* Total Production Cost / HPP Value */}
      <div className="stat-card highlight-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Total Estimasi HPP</span>
          <div className="stat-icon-wrapper primary">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="stat-card-value font-mono text-primary-gradient">
          {formatRupiah(totalProductionValue)}
        </div>
        <div className="stat-card-desc">Nilai total modal kain + acc + jasa</div>
      </div>
    </div>
  );
};
