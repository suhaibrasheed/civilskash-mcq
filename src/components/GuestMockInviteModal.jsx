import React from 'react';
import { Trophy, LogIn, Sparkles, X, ShieldCheck, CheckCircle2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GuestMockInviteModal({
  isOpen,
  onClose,
  test
}) {
  const navigate = useNavigate();

  if (!isOpen || !test) return null;

  const handleSignIn = () => {
    onClose();
    navigate('/signin', { 
      state: { 
        redirectTo: `/global-test/${test.id}`,
        message: `Sign in or create your free account to claim your 1 attempt for ${test.title}!`
      } 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-theme-surface border border-theme-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200 relative">
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
            <Trophy size={28} />
          </div>

          <div>
            <span className="text-[10px] font-black text-amber-500 tracking-wider uppercase bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Official Statewide Mock
            </span>
            <h3 className="font-black text-xl text-theme-text mt-2 tracking-tight">
              Welcome, Aspirant!
            </h3>
            <p className="text-xs text-theme-muted mt-1 leading-relaxed">
              You’ve been invited to take <strong className="text-theme-text">{test.title}</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-theme-bg/70 rounded-2xl border border-theme-border text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-theme-text font-bold text-[11px]">
              <ShieldCheck size={14} className="text-amber-500 shrink-0" />
              <span>Why an account is required:</span>
            </div>
            <ul className="space-y-1 text-theme-muted text-[11px] pl-5 list-disc">
              <li>Strict 1-attempt anti-tamper security</li>
              <li>Official statewide merit rank & percentile generation</li>
              <li>Free access to master solution key on Result Day</li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleSignIn}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={15} />
              <span>Sign In / Create Free Account</span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-theme-bg hover:bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text font-bold text-xs rounded-xl transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
