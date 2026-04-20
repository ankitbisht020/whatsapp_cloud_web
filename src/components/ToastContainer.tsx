import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '../store/useStore';
import { AnimatePresence, motion } from 'framer-motion';

const iconMap = {
  success: <CheckCircle size={20} color="#25D366" />,
  error: <AlertCircle size={20} color="#ef4444" />,
  warning: <AlertTriangle size={20} color="#f59e0b" />,
  info: <Info size={20} color="#3b82f6" />,
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="toast-icon">{iconMap[toast.type]}</div>
            <div className="toast-content">
              <h4>{toast.title}</h4>
              {toast.message && <p>{toast.message}</p>}
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
