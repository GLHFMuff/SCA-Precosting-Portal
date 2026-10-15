import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculatePrecostingTotals } from '../data/initialPrecostings';
import { precostingApi } from '../services/api';

const PrecostingContext = createContext();

const USER_STORAGE_KEY = 'cloth_precosting_user_v1';

// Clear any previous mock dummy data from localStorage
try {
  localStorage.removeItem('cloth_precosting_data_v1');
} catch {
  // ignore
}

export const PrecostingProvider = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Precosting items list - Online only from PostgreSQL API
  const [precostings, setPrecostings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Backend connection status
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [dbInfo, setDbInfo] = useState(null);

  // Sync with backend API (Mandatory Online Mode)
  const refreshFromBackend = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const health = await precostingApi.getHealth();
      if (health && health.status === 'ok') {
        setIsBackendOnline(true);
        setDbInfo(health.database);
        const res = await precostingApi.getAll();
        if (res && res.success && Array.isArray(res.data)) {
          setPrecostings(res.data.map(calculatePrecostingTotals));
          setIsLoading(false);
          return true;
        } else {
          setPrecostings([]);
        }
      } else {
        setIsBackendOnline(false);
        setDbInfo(null);
        setApiError('Server API backend tidak aktif atau database belum terhubung.');
      }
    } catch (err) {
      setIsBackendOnline(false);
      setDbInfo(null);
      setApiError(err.message || 'Gagal memuat data precosting dari API.');
    }
    setIsLoading(false);
    return false;
  };

  useEffect(() => {
    refreshFromBackend();
  }, []);

  // Navigation & Selected Item
  const [selectedId, setSelectedId] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'Pending Approval', 'Approved', 'Draft', 'Revision'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'qty-desc', 'cost-desc', 'name-asc'

  // Modals state
  const [approvalModalItem, setApprovalModalItem] = useState(null);
  const [remarksModalItem, setRemarksModalItem] = useState(null);

  // Notification toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Auth actions
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    showToast(`Selamat datang kembali, ${userData.name}!`);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    showToast('Anda telah logout dari portal.', 'info');
  };

  // Precosting actions
  const selectPrecosting = (id) => {
    setSelectedId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSelectedPrecosting = () => {
    setSelectedId(null);
  };

  const selectedPrecosting = precostings.find((p) => String(p.id) === String(selectedId) || p.precostingNo === selectedId) || null;

  // Add remark
  const addRemark = async (precostingId, text) => {
    if (!text || !text.trim()) return;

    const authorName = user ? user.name : 'System User';
    const authorRole = user ? user.role : 'Merchandiser';
    const now = new Date();
    const timestamp = now.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    try {
      await precostingApi.addRemark(precostingId, {
        author: authorName,
        role: authorRole,
        text: text.trim(),
      });
      showToast('Catatan/remarks berhasil ditambahkan ke database!');
      refreshFromBackend();
    } catch {
      // Local optimistic update
      setPrecostings((prev) =>
        prev.map((item) => {
          if (String(item.id) === String(precostingId)) {
            const newRemark = {
              id: `rem-${Date.now()}`,
              author: authorName,
              role: authorRole,
              timestamp,
              text: text.trim(),
            };
            return {
              ...item,
              remarks: [newRemark, ...(item.remarks || [])],
            };
          }
          return item;
        })
      );
      showToast('Catatan/remarks berhasil ditambahkan!');
    }
  };

  // Approve precosting
  const approvePrecosting = async (precostingId, approvalNotes = '') => {
    const approverName = user ? `${user.name} (${user.role})` : 'Authorized Manager';

    try {
      await precostingApi.approve(precostingId, approvalNotes, approverName);
      showToast('Precosting berhasil di-Approve di PostgreSQL!', 'success');
      refreshFromBackend();
    } catch {
      setPrecostings((prev) =>
        prev.map((item) => {
          if (String(item.id) === String(precostingId)) {
            return calculatePrecostingTotals({
              ...item,
              status: 'Approved',
              approvedBy: approverName,
              approvalDate: new Date().toISOString(),
              approvalNotes: approvalNotes || 'Approved via Precosting Portal',
            });
          }
          return item;
        })
      );
      showToast('Precosting berhasil di-Approve!', 'success');
    }
  };

  // Reject / Request Revision
  const rejectPrecosting = async (precostingId, reason = '') => {
    const reviewerName = user ? `${user.name} (${user.role})` : 'Reviewer';

    try {
      await precostingApi.reject(precostingId, reason, reviewerName);
      showToast('Status berhasil diubah menjadi Perlu Revisi di database.', 'warning');
      refreshFromBackend();
    } catch {
      setPrecostings((prev) =>
        prev.map((item) => {
          if (String(item.id) === String(precostingId)) {
            return calculatePrecostingTotals({
              ...item,
              status: 'Revision',
              approvalNotes: reason || 'Memerlukan revisi data costing',
            });
          }
          return item;
        })
      );
      showToast('Status diubah menjadi Perlu Revisi.', 'warning');
    }
  };

  return (
    <PrecostingContext.Provider
      value={{
        user,
        login,
        logout,
        precostings,
        isLoading,
        apiError,
        isBackendOnline,
        dbInfo,
        refreshFromBackend,
        selectedId,
        selectedPrecosting,
        selectPrecosting,
        clearSelectedPrecosting,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        sortBy,
        setSortBy,
        addRemark,
        approvePrecosting,
        rejectPrecosting,
        // Modal state
        approvalModalItem,
        setApprovalModalItem,
        remarksModalItem,
        setRemarksModalItem,
        toast,
        showToast,
      }}
    >
      {children}
    </PrecostingContext.Provider>
  );
};

export const usePrecosting = () => {
  const context = useContext(PrecostingContext);
  if (!context) {
    throw new Error('usePrecosting must be used within a PrecostingProvider');
  }
  return context;
};
