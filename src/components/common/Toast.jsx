import React from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast = () => {
  const { toast } = usePrecosting();

  if (!toast) return null;

  return (
    <div className={`toast-notification toast-${toast.type || 'success'}`}>
      {toast.type === 'error' && <AlertCircle size={18} />}
      {toast.type === 'info' && <Info size={18} />}
      {toast.type === 'warning' && <AlertCircle size={18} />}
      {(!toast.type || toast.type === 'success') && <CheckCircle2 size={18} />}
      <span className="toast-message">{toast.message}</span>
    </div>
  );
};
