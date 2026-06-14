import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function UniversalModal({ isOpen, onClose, title, children, showClose = true, variant = 'default' }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const bgVariants = {
    default: 'bg-theme-bg/60 backdrop-blur-md',
    shatter: 'bg-black/40 backdrop-blur-md',
    victory: 'bg-black/40 backdrop-blur-md',
  };

  const themeStyles = {
    light: {
      shatter: 'bg-white border-rose-200 text-rose-900 shadow-rose-500/10',
      victory: 'bg-white border-emerald-200 text-emerald-900 shadow-emerald-500/10',
    },
    dark: {
      shatter: 'bg-[#1a0a0a] border-rose-500/30 text-rose-50 shadow-rose-900/40',
      victory: 'bg-[#0a1a0a] border-emerald-500/30 text-emerald-50 shadow-emerald-900/40',
    },
    sepia: {
      shatter: 'bg-[#f4e4d4] border-rose-300 text-rose-950 shadow-rose-900/10',
      victory: 'bg-[#e4f4e4] border-emerald-300 text-emerald-950 shadow-emerald-900/10',
    }
  };

  const variantStyle = themeStyles[theme]?.[variant] || (variant === 'default' ? 'bg-theme-surface border-theme-border text-theme-text' : themeStyles.light[variant]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 backdrop-blur-md ${bgVariants[variant] || bgVariants.default}`}
            onClick={showClose ? onClose : undefined}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden ${variantStyle}`}
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between p-4 border-b border-inherit/20">
                {title && <h2 className="text-xl font-bold">{title}</h2>}
                {showClose && (
                  <button 
                    onClick={onClose}
                    className="p-2 ml-auto rounded-full hover:bg-black/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
