import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, FileText, Keyboard, Globe, ShoppingBag } from 'lucide-react';

export default function MoreAppsModal({ isOpen, onClose }) {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAppClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] overflow-y-auto flex items-start justify-center p-4 py-8">
      <div 
        className="w-full max-w-[420px] my-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col scale-100 animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'rgba(var(--color-surface-rgb), 0.96)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(var(--color-text-rgb), 0.08)'
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4.5 flex justify-between items-center border-b bg-theme-bg/5"
          style={{ borderColor: 'rgba(var(--color-text-rgb), 0.05)' }}
        >
          <h3 className="font-extrabold text-xs tracking-wider text-theme-text uppercase">
            Kash Power Suit
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl hover:bg-theme-text/5 text-theme-muted hover:text-theme-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          
          {/* Join our Community Button */}
          <a 
            href="https://t.me/civilskash"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 rounded-2xl border border-sky-400/30 bg-sky-500/5 hover:bg-sky-500/10 text-sky-400 font-extrabold text-xs flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] shadow-[0_0_15px_rgba(56,189,248,0.02)] active:scale-98"
          >
            <Send size={14} className="rotate-45 -mt-0.5" />
            Join our Community
          </a>

          {/* NoteKash Card */}
          <div 
            onClick={() => handleAppClick('https://notekash.com')}
            className="w-full p-2 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group cursor-pointer"
            style={{
              background: 'rgba(var(--color-text-rgb), 0.015)',
              border: '1px solid rgba(var(--color-text-rgb), 0.04)'
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/15 flex items-center justify-center text-amber-500 shrink-0 group-hover:scale-105 transition-transform">
              <FileText size={18} />
            </div>
            <div className="space-y-0.5 text-left flex-1">
              <h4 className="font-extrabold text-xs text-theme-text tracking-wide group-hover:text-theme-primary transition-colors uppercase">
                NoteKash
              </h4>
              <p className="text-[11px] text-theme-muted leading-relaxed font-semibold">
                Premium note taking app to turn your notes into knowledge
              </p>
            </div>
          </div>

          {/* Typing Game Card */}
          <div 
            onClick={() => handleAppClick('https://typing.civilskash.in')}
            className="w-full p-2 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group cursor-pointer"
            style={{
              background: 'rgba(var(--color-text-rgb), 0.015)',
              border: '1px solid rgba(var(--color-text-rgb), 0.04)'
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-105 transition-transform">
              <Keyboard size={18} />
            </div>
            <div className="space-y-0.5 text-left flex-1">
              <h4 className="font-extrabold text-xs text-theme-text tracking-wide group-hover:text-theme-primary transition-colors uppercase">
                Typing Game
              </h4>
              <p className="text-[11px] text-theme-muted leading-relaxed font-semibold">
                Improve your typing speed and accuracy with fun interactive games
              </p>
            </div>
          </div>

          {/* Store House Card */}
          <div 
            onClick={() => handleAppClick('https://civilskash.in/store')}
            className="w-full p-2 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group cursor-pointer"
            style={{
              background: 'rgba(var(--color-text-rgb), 0.015)',
              border: '1px solid rgba(var(--color-text-rgb), 0.04)'
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/15 flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingBag size={18} />
            </div>
            <div className="space-y-0.5 text-left flex-1">
              <h4 className="font-extrabold text-xs text-theme-text tracking-wide group-hover:text-theme-primary transition-colors uppercase">
                Store House
              </h4>
              <p className="text-[11px] text-theme-muted leading-relaxed font-semibold">
                Get premium colored notes and MCQs in PDF format for your preparation
              </p>
            </div>
          </div>

          {/* Current Affairs Card */}
          <div 
            onClick={() => handleAppClick('https://civilskash.in/currentaffairs')}
            className="w-full p-2 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group cursor-pointer"
            style={{
              background: 'rgba(var(--color-text-rgb), 0.015)',
              border: '1px solid rgba(var(--color-text-rgb), 0.04)'
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/10 to-sky-600/5 border border-sky-500/15 flex items-center justify-center text-sky-550 shrink-0 group-hover:scale-105 transition-transform" style={{ color: 'rgb(var(--color-primary))' }}>
              <Globe size={18} />
            </div>
            <div className="space-y-0.5 text-left flex-1">
              <h4 className="font-extrabold text-xs text-theme-text tracking-wide group-hover:text-theme-primary transition-colors uppercase">
                Current Affairs
              </h4>
              <p className="text-[11px] text-theme-muted leading-relaxed font-semibold">
                Weekly updated current affairs for comprehensive exam preparation
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
