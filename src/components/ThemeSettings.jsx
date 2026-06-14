import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, BookOpen, Volume2, VolumeX, Vibrate, VibrateOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSound } from '../context/SoundContext';

export default function ThemeSettings({ isOpen, onClose }) {
  const { theme, setTheme } = useTheme();
  const { soundEnabled, setSoundEnabled, hapticEnabled, setHapticEnabled } = useSound();

  const themes = [
    { id: 'light', name: 'Light', icon: Sun, desc: 'Clean, high-contrast white' },
    { id: 'dark', name: 'Dark', icon: Moon, desc: 'Deep slate with emerald accents' },
    { id: 'sepia', name: 'Sepia', icon: BookOpen, desc: 'Warm parchment for long study' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-theme-bg border-l border-theme-border p-6 z-50 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-theme-text">Theme Engine</h2>
              <button onClick={onClose} className="p-2 hover:bg-theme-surface rounded-full transition-colors text-theme-muted hover:text-theme-text">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); onClose(); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${theme === t.id ? 'bg-theme-primary/10 border-theme-primary text-theme-primary' : 'border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-theme-text'}`}
                >
                  <t.icon size={24} className={theme === t.id ? 'text-theme-primary' : 'text-theme-muted'} />
                  <div className="text-left">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-theme-muted mt-1">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 space-y-4 pt-6 border-t border-theme-border">
              <h3 className="text-sm font-bold text-theme-muted uppercase tracking-wider mb-2">Sensory Preferences</h3>
              
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${soundEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-theme-muted'}`}
              >
                <div className="flex items-center gap-3">
                  {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  <span className="font-semibold">{soundEnabled ? 'Sound Enabled' : 'Muted'}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-theme-border'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${soundEnabled ? 'translate-x-5' : ''}`} />
                </div>
              </button>

              <button
                onClick={() => setHapticEnabled(!hapticEnabled)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${hapticEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-theme-muted'}`}
              >
                <div className="flex items-center gap-3">
                  {hapticEnabled ? <Vibrate size={20} /> : <VibrateOff size={20} />}
                  <span className="font-semibold">{hapticEnabled ? 'Haptics On' : 'Haptics Off'}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${hapticEnabled ? 'bg-emerald-500' : 'bg-theme-border'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${hapticEnabled ? 'translate-x-5' : ''}`} />
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
