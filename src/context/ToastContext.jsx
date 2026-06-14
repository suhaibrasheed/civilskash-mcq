import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, Sparkles, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Floating Container */}
      <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-3 pointer-events-none max-w-md w-full px-4 md:px-0 md:w-96">
        <AnimatePresence>
          {toasts.map((toast) => {
            let Icon = Info;
            let iconColor = 'text-blue-500';
            let bgGlow = 'rgba(59, 130, 246, 0.08)';
            let borderColor = 'rgba(59, 130, 246, 0.2)';

            if (toast.type === 'success') {
              Icon = CheckCircle2;
              iconColor = 'text-emerald-500';
              bgGlow = 'rgba(16, 185, 129, 0.08)';
              borderColor = 'rgba(16, 185, 129, 0.2)';
            } else if (toast.type === 'error') {
              Icon = XCircle;
              iconColor = 'text-rose-500';
              bgGlow = 'rgba(244, 63, 94, 0.08)';
              borderColor = 'rgba(244, 63, 94, 0.2)';
            } else if (toast.type === 'warning') {
              Icon = Info;
              iconColor = 'text-amber-500';
              bgGlow = 'rgba(245, 158, 11, 0.08)';
              borderColor = 'rgba(245, 158, 11, 0.2)';
            } else if (toast.type === 'ai') {
              Icon = Sparkles;
              iconColor = 'text-purple-500';
              bgGlow = 'rgba(168, 85, 247, 0.08)';
              borderColor = 'rgba(168, 85, 247, 0.2)';
            }

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 15, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: 30, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                style={{
                  background: 'var(--color-surface)',
                  borderColor: borderColor,
                  boxShadow: 'var(--shadow-float)',
                  borderWidth: '1px',
                }}
                className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border relative overflow-hidden group"
              >
                {/* Visual Accent Glow */}
                <div 
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 10% 20%, ${bgGlow}, transparent 50%)`
                  }}
                />

                <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                  <Icon size={18} />
                </div>

                <div className="flex-1 text-xs font-semibold text-theme-text leading-relaxed pr-4">
                  {toast.message}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-theme-muted hover:text-theme-text transition-colors p-0.5 rounded-lg hover:bg-theme-surface-hover shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
