import React, { createContext, useContext, useState, useEffect } from 'react';
import { getInitialPrecostings, calculatePrecostingTotals } from '../data/initialPrecostings';

const PrecostingContext = createContext();

const LOCAL_STORAGE_KEY = 'cloth_precosting_data_v1';
const USER_STORAGE_KEY = 'cloth_precosting_user_v1';

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

  // Precosting items list
  const [precostings, setPrecostings] = useState(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(calculatePrecostingTotals);
        }
      }
    } catch (e) {
      console.error('Failed to parse saved precostings:', e);
    }
    return getInitialPrecostings();
  });

  // Navigation & Selected Item
  const [selectedId, setSelectedId] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'Pending Approval', 'Approved', 'Draft', 'Revision'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'qty-desc', 'cost-desc', 'name-asc'

  // Modals state
  const [approvalModalItem, setApprovalModalItem] = useState(null);
  const [remarksModalItem, setRemarksModalItem] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Notification toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync precostings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(precostings));
    } catch (e) {
      console.error('Failed to save precostings to localStorage:', e);
    }
  }, [precostings]);

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

  const selectedPrecosting = precostings.find((p) => p.id === selectedId) || null;

  // Add remark
  const addRemark = (precostingId, text) => {
    if (!text || !text.trim()) return;

    const authorName = user ? user.name : 'System User';
    const authorRole = user ? user.role : 'Merchandiser';
    const now = new Date();
    const timestamp = now.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setPrecostings((prev) =>
      prev.map((item) => {
        if (item.id === precostingId) {
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
  };

  // Approve precosting
  const approvePrecosting = (precostingId, approvalNotes = '') => {
    const approverName = user ? `${user.name} (${user.role})` : 'Authorized Manager';
    const now = new Date();
    const timestamp = now.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setPrecostings((prev) =>
      prev.map((item) => {
        if (item.id === precostingId) {
          const updatedRemarks = [...(item.remarks || [])];
          if (approvalNotes && approvalNotes.trim()) {
            updatedRemarks.unshift({
              id: `rem-appr-${Date.now()}`,
              author: approverName,
              role: user?.role || 'Approver',
              timestamp,
              text: `[APPROVAL NOTES]: ${approvalNotes.trim()}`,
            });
          }

          return calculatePrecostingTotals({
            ...item,
            status: 'Approved',
            approvedBy: approverName,
            approvalDate: timestamp,
            approvalNotes: approvalNotes || 'Approved via Precosting Portal',
            remarks: updatedRemarks,
          });
        }
        return item;
      })
    );

    showToast(`Precosting berhasil di-Approve!`, 'success');
  };

  // Reject / Request Revision
  const rejectPrecosting = (precostingId, reason = '') => {
    const reviewerName = user ? `${user.name} (${user.role})` : 'Reviewer';
    const now = new Date();
    const timestamp = now.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setPrecostings((prev) =>
      prev.map((item) => {
        if (item.id === precostingId) {
          const updatedRemarks = [...(item.remarks || [])];
          if (reason && reason.trim()) {
            updatedRemarks.unshift({
              id: `rem-rev-${Date.now()}`,
              author: reviewerName,
              role: user?.role || 'Reviewer',
              timestamp,
              text: `[PERMINTAAN REVISI]: ${reason.trim()}`,
            });
          }

          return calculatePrecostingTotals({
            ...item,
            status: 'Revision',
            approvalNotes: reason || 'Memerlukan revisi data costing',
            remarks: updatedRemarks,
          });
        }
        return item;
      })
    );

    showToast(`Status diubah menjadi Perlu Revisi.`, 'warning');
  };

  // Add new precosting
  const addNewPrecosting = (newItem) => {
    const calculated = calculatePrecostingTotals({
      ...newItem,
      id: `pc-${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Pending Approval',
      remarks: [
        {
          id: `rem-${Date.now()}`,
          author: user ? user.name : 'System User',
          role: user ? user.role : 'Merchandiser',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          text: 'Project precosting baru dibuat dan siap untuk proses review/approval.',
        },
      ],
    });

    setPrecostings((prev) => [calculated, ...prev]);
    showToast(`Precosting ${calculated.precostingNo} berhasil ditambahkan!`);
  };

  // Reset to default sample data
  const resetToDefaultData = () => {
    const fresh = getInitialPrecostings();
    setPrecostings(fresh);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fresh));
    showToast('Data dikembalikan ke sampel awal pabrik.', 'info');
  };

  return (
    <PrecostingContext.Provider
      value={{
        user,
        login,
        logout,
        precostings,
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
        addNewPrecosting,
        resetToDefaultData,
        // Modal state
        approvalModalItem,
        setApprovalModalItem,
        remarksModalItem,
        setRemarksModalItem,
        isNewModalOpen,
        setIsNewModalOpen,
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
