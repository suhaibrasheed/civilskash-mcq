import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function FeedbackModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFeedbackText('');
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getDeviceInfo = () => {
    try {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        deviceMemory: navigator.deviceMemory || null,
        cpuCores: navigator.hardwareConcurrency || null,
        touchSupport: ('maxTouchPoints' in navigator) ? navigator.maxTouchPoints > 0 : false,
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
      };
    } catch (e) {
      return { error: 'Failed to capture device info: ' + e.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (feedbackText.trim().length < 150) {
      showToast('Feedback must be at least 150 characters to submit.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        content: feedbackText,
        device_info: getDeviceInfo(),
        user_id: user?.id || null,
        user_email: user?.email || 'guest'
      };

      const { error } = await supabase.from('feedbacks').insert([payload]);

      if (error) throw error;

      showToast('Thank you! Your feedback has been sent successfully.', 'success');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast(error.message || 'Failed to send feedback. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = feedbackText.length;
  const charsRemaining = 150 - charCount;
  const isValid = charCount >= 150;

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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-theme-primary bg-theme-primary/8 border border-theme-primary/15">
              <MessageSquare size={15} />
            </div>
            <h3 className="font-extrabold text-xs tracking-wider text-theme-text uppercase">
              Send Feedback
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl hover:bg-theme-text/5 text-theme-muted hover:text-theme-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {/* Centered Text Hint */}
          <div className="text-center px-4">
            <p className="text-[11px] text-theme-muted/80 leading-relaxed font-semibold">
              Share a bug, suggest features, or tell us how we can improve. Detailed suggestions are extremely helpful for us!
            </p>
          </div>

          {/* Feedback Textarea */}
          <div className="flex flex-col gap-2">
            <textarea
              required
              rows={6}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe your feedback or suggestion in detail..."
              className="w-full p-4 rounded-2xl text-xs bg-theme-bg border text-theme-text placeholder-theme-muted/40 focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/30 transition-all resize-none custom-scrollbar"
              style={{
                fontFamily: 'inherit',
                borderColor: 'rgba(var(--color-text-rgb), 0.08)'
              }}
            />
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-theme-muted font-bold">
                {isValid ? (
                  <span className="text-emerald-500 font-extrabold">{charCount} characters typed</span>
                ) : (
                  <span>{charsRemaining} characters required to submit</span>
                )}
              </span>
              <span className="text-[10px] text-theme-muted/60 font-bold">Min 150 chars</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {/* Contact Admin Telegram Button */}
            <a 
              href="https://t.me/fusionistic" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sky-400 bg-sky-500/5 border border-sky-400/20 hover:bg-sky-500/12 hover:border-sky-400/30 text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_2px_10px_rgba(56,189,248,0.02)] active:scale-98"
            >
              <Send size={12} className="rotate-45 -mt-0.5" />
              Contact Admin
            </a>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 border ${
                isValid && !isSubmitting
                  ? 'bg-theme-primary/8 border-theme-primary/20 text-theme-primary hover:bg-theme-primary/15 hover:border-theme-primary/30 cursor-pointer shadow-[0_2px_10px_rgba(var(--color-primary-rgb),0.02)]'
                  : 'bg-theme-border/5 text-theme-muted/30 border-theme-border/5 cursor-not-allowed'
              }`}
              style={{
                borderColor: isValid && !isSubmitting ? undefined : 'rgba(var(--color-text-rgb), 0.04)'
              }}
            >
              {isSubmitting ? 'Sending...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
