import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X, HelpCircle } from 'lucide-react';
import { useEconomy } from '../context/EconomyContext';
import { useToast } from '../context/ToastContext';
import { EXAM_SERIES } from '../lib/exams';
import { updateUserEconomy } from '../lib/db';
import { supabase } from '../lib/supabase';

export default function StudyGoalsModal({ isOpen, onClose }) {
  const { economy, refreshEconomy } = useEconomy();
  const { showToast } = useToast();

  const [targetExam, setTargetExam] = useState(null);
  const [smartMockLimit, setSmartMockLimit] = useState(20);
  const [dndFocusActive, setDndFocusActive] = useState(false);
  const [smartDndActive, setSmartDndActive] = useState(true);
  const [aiLanguage, setAiLanguage] = useState('English');
  const [activeTooltip, setActiveTooltip] = useState(null);

  useEffect(() => {
    if (isOpen && economy) {
      setTargetExam(economy.target_exam || null);
      setSmartMockLimit(economy.smart_mock_limit || 20);
      setDndFocusActive(!!economy.dnd_focus_active);
      setSmartDndActive(economy.smart_dnd_active ?? true);
      setAiLanguage(localStorage.getItem('civilsKash_aiLanguage') || 'English');
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, economy]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      await updateUserEconomy({
        target_exam: targetExam,
        smart_mock_limit: Number(smartMockLimit),
        dnd_focus_active: dndFocusActive,
        smart_dnd_active: smartDndActive,
      });

      if (economy?.id && economy.id !== 'default_user') {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ target_exam: targetExam })
            .eq('id', economy.id);
          if (error) throw error;
        } catch (supabaseErr) {
          console.warn("Failed to sync study goals to Supabase, saved locally:", supabaseErr);
          showToast('Saved locally. Cloud sync pending.', 'warning');
        }
      }

      if (economy?.id && economy.id !== 'default_user') {
        const cacheKey = `mcqkash_profile_cache_${economy.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            parsed.target_exam = targetExam;
            localStorage.setItem(cacheKey, JSON.stringify(parsed));
          } catch (e) {
            console.warn("Failed to update profile cache locally:", e);
          }
        }
      }

      localStorage.setItem('civilsKash_aiLanguage', aiLanguage);
      await refreshEconomy(true);
      showToast('Study goals saved!', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save study goals.', 'error');
    }
  };

  // Safe tooltip wrapper avoiding mobile overflows
  const SettingRow = ({ id, label, tooltip, children }) => (
    <div className="space-y-2 relative">
      <div className="flex items-center gap-1.5">
        <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">{label}</label>
        <button
          type="button"
          onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
          className="text-theme-muted hover:text-theme-primary transition-colors p-0.5 rounded-full"
        >
          <HelpCircle size={13} />
        </button>
      </div>
      {activeTooltip === id && (
        <div className="absolute left-0 right-0 top-6 bg-theme-surface border border-theme-border p-3 rounded-xl shadow-xl z-50 text-[10px] text-theme-text font-bold leading-normal animate-in fade-in duration-150">
          {tooltip}
        </div>
      )}
      {children}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99999] overflow-y-auto flex items-start justify-center p-3 py-4">
      <div className="w-full max-w-lg my-auto">
        <div 
          className="rounded-3xl w-full max-h-[calc(100dvh-2rem)] shadow-2xl overflow-hidden flex flex-col scale-100 animate-in fade-in zoom-in-95 duration-200"
          style={{
            background: 'rgba(var(--color-surface-rgb), 0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(var(--color-primary), 0.15)'
          }}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-theme-bg/30 flex justify-between items-center">
            <h3 className="font-black text-base text-theme-text flex items-center gap-2 uppercase tracking-tight">
              <Trophy size={16} className="text-theme-primary animate-pulse" /> Study Goals & Focus
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-theme-bg text-theme-muted hover:text-theme-text transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            
            {/* Target Exam Option */}
            <SettingRow 
              id="exam" 
              label="Target Exam" 
              tooltip="Prioritizes matching questions and relevant topics in practice flows."
            >
              <div className="relative">
                <select
                  value={targetExam || ''}
                  onChange={(e) => setTargetExam(e.target.value || null)}
                  className="w-full p-4 pr-10 rounded-2xl border text-sm font-bold bg-theme-surface-hover/30 border-theme-border/50 text-theme-text focus:outline-none focus:border-theme-primary transition-all shadow-sm cursor-pointer appearance-none"
                  style={{ background: 'rgba(var(--color-surface-rgb), 0.45)', backdropFilter: 'blur(8px)' }}
                >
                  <option value="" style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>No Target Exam (All Exams)</option>
                  {EXAM_SERIES.map((exam) => (
                    <option key={exam.id} value={exam.id} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>{exam.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-theme-muted">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            </SettingRow>

            {/* Smart Mock Limit Option */}
            <SettingRow 
              id="smartMock" 
              label="Smart Mock Questions" 
              tooltip="Set up questions in MCQ Pages for Pro users. Adjusts the size of generated Smart Mock sessions."
            >
              <div className="relative">
                <select
                  value={smartMockLimit}
                  onChange={(e) => setSmartMockLimit(Number(e.target.value))}
                  className="w-full p-4 pr-10 rounded-2xl border text-sm font-bold bg-theme-surface-hover/30 border-theme-border/50 text-theme-text focus:outline-none focus:border-theme-primary transition-all shadow-sm cursor-pointer appearance-none"
                  style={{ background: 'rgba(var(--color-surface-rgb), 0.45)', backdropFilter: 'blur(8px)' }}
                >
                  {[10, 20, 30, 40, 50].map((num) => (
                    <option key={num} value={num} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>{num} Questions {num === 20 ? '(Default)' : ''}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-theme-muted">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            </SettingRow>

            {/* AI Language Option */}
            <SettingRow 
              id="aiLang" 
              label="AI Preferred Language" 
              tooltip="Select your preferred language for explanations, hints, and concept summaries."
            >
              <div className="relative">
                <select
                  value={aiLanguage}
                  onChange={(e) => setAiLanguage(e.target.value)}
                  className="w-full p-4 pr-10 rounded-2xl border text-sm font-bold bg-theme-surface-hover/30 border-theme-border/50 text-theme-text focus:outline-none focus:border-theme-primary transition-all shadow-sm cursor-pointer appearance-none"
                  style={{ background: 'rgba(var(--color-surface-rgb), 0.45)', backdropFilter: 'blur(8px)' }}
                >
                  <option value="English" style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>English (Default)</option>
                  <option value="Hinglish" style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>Hinglish</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-theme-muted">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            </SettingRow>

            {/* Notification Silencing Option */}
            <SettingRow 
              id="dnd" 
              label="Notification Silencing (DND)" 
              tooltip="Configure focus controls to mute spaced repetition reminders, backlog alerts, or during active mocks."
            >
              <div className="space-y-3">
                {/* Focus switch */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-theme-border/50" style={{ background: 'rgba(var(--color-surface-rgb), 0.3)', backdropFilter: 'blur(8px)' }}>
                  <div>
                    <span className="text-xs font-black text-theme-text block">DND Focus Mode</span>
                    <p className="text-[9px] text-theme-muted font-bold">Silences backlog warnings and reminders.</p>
                  </div>
                  <button type="button" onClick={() => setDndFocusActive(!dndFocusActive)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${dndFocusActive ? 'bg-theme-primary' : 'bg-theme-border'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${dndFocusActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Silence switch */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-theme-border/50" style={{ background: 'rgba(var(--color-surface-rgb), 0.3)', backdropFilter: 'blur(8px)' }}>
                  <div>
                    <span className="text-xs font-black text-theme-text block">Smart In-Test Silence</span>
                    <p className="text-[9px] text-theme-muted font-bold">Mutes alerts automatically inside mock tests.</p>
                  </div>
                  <button type="button" onClick={() => setSmartDndActive(!smartDndActive)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${smartDndActive ? 'bg-theme-primary' : 'bg-theme-border'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${smartDndActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </SettingRow>

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 flex gap-3 bg-theme-surface border-t border-theme-border/10">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-theme-text bg-theme-bg border border-theme-border/50 text-xs hover:bg-theme-surface-hover transition-colors active:scale-95">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold text-white bg-theme-primary hover:opacity-90 text-xs shadow-md transition-all active:scale-95">Save Goals</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
