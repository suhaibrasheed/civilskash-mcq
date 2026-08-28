import React, { useMemo } from 'react';
import { ShieldCheck, Clock, FileText, CheckCircle2, AlertTriangle, X, Sparkles, Award, ArrowRight, Calendar, UserCheck } from 'lucide-react';
import Avatar from './Avatars';
import { formatExamName } from '../lib/globalTestsApi';
import { useEconomy } from '../context/EconomyContext';

/**
 * Deterministically generates a clean official Roll Number for a candidate & test.
 */
export function generateRollNumber(testId = '', userId = '') {
  let hash = 0;
  const str = `${testId}_${userId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  const positiveHash = Math.abs(hash) % 9000 + 1000; // 4-digit clean number 1000-9999
  const testCode = String(testId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'MOK';
  return `MCQ-2026-${testCode}-${positiveHash}`;
}

export default function DigitalAdmitCardModal({
  isOpen,
  onClose,
  onProceed,
  test,
  user
}) {
  if (!isOpen || !test) return null;

  const { economy } = useEconomy();

  // Extract Full Name vs Username from economy (matches User Profile Card)
  const fullName = economy?.full_name || 
                   user?.user_metadata?.full_name || 
                   user?.user_metadata?.name || 
                   user?.user_metadata?.display_name || 
                   'Civil Services Aspirant';

  const rawUsername = economy?.username || 
                      user?.user_metadata?.username || 
                      user?.email?.split('@')[0] || 
                      'aspirant';
  const usernameDisplay = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`;

  const avatarId = economy?.avatar_id || user?.user_metadata?.avatar_id || 1;
  
  const rollNumber = useMemo(() => {
    return generateRollNumber(test.id, user?.id || 'guest');
  }, [test.id, user?.id]);

  const totalQuestions = test.total_questions || (test.questions_data?.length ?? 120);
  const durationMins = test.duration_mins || 120;
  const negativeMarking = test.negative_marking ?? 0.25;
  const totalMarks = totalQuestions * (test.marks_per_question || 1.0);
  
  const formattedResultDate = test.result_reveal_at 
    ? new Date(test.result_reveal_at).toLocaleString('en-IN', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : 'Synchronized on Result Day';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-theme-surface border border-theme-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] scale-100 animate-in zoom-in-95 duration-200 relative">
        
        {/* Decorative Top Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        {/* Header Strip */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-theme-border bg-theme-bg/50 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[9.5px] sm:text-[10px] uppercase tracking-wider mb-1">
              <ShieldCheck size={12} /> Official E-Admit Card
            </div>
            <h2 className="font-black text-lg sm:text-xl text-theme-text tracking-tight">
              National Examination Hall Ticket
            </h2>
            <p className="text-[11px] sm:text-xs text-theme-muted font-medium mt-0.5">
              MCQKash Official Mock Series
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-theme-bg hover:bg-theme-surface-hover border border-theme-border text-theme-muted hover:text-theme-text transition-all"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Candidate Profile Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-theme-bg via-theme-bg/80 to-theme-surface border border-theme-border flex items-center gap-3.5 sm:gap-4 shadow-inner">
            <div className="relative shrink-0">
              <Avatar avatarId={avatarId} size="md" />
              <div className="absolute -bottom-1 -right-1 p-0.5 sm:p-1 bg-amber-500 text-slate-950 rounded-full shadow">
                <Award size={11} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[9.5px] font-bold text-theme-muted uppercase tracking-wider block">Candidate Name</span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-theme-text truncate capitalize">
                  {fullName}
                </h3>
                <span className="text-xs font-semibold text-amber-500/90 lowercase">
                  ({usernameDisplay})
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-theme-muted font-bold">ROLL NO:</span>
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {rollNumber}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-theme-bg border border-theme-border text-theme-muted">
                  {formatExamName(test.exam_id)}
                </span>
              </div>
            </div>
          </div>

          {/* Exam Title & Evaluation Mode Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2 p-3 rounded-xl bg-theme-bg/60 border border-theme-border">
              <span className="text-[9.5px] font-bold text-theme-muted uppercase tracking-wider block mb-0.5">Target Paper</span>
              <span className="font-black text-xs sm:text-sm text-theme-text line-clamp-1">
                {test.title}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <span className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                <Award size={10} /> Evaluation
              </span>
              <span className="font-black text-xs text-emerald-300 block">
                Instant
              </span>
            </div>
          </div>

          {/* Exam Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 sm:p-3 rounded-xl bg-theme-bg/50 border border-theme-border text-center">
              <span className="text-[9.5px] font-bold text-theme-muted uppercase block">Questions</span>
              <span className="text-xs sm:text-sm font-black text-theme-text">{totalQuestions} MCQs</span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-theme-bg/50 border border-theme-border text-center">
              <span className="text-[9.5px] font-bold text-theme-muted uppercase block">Duration</span>
              <span className="text-xs sm:text-sm font-black text-theme-text">{durationMins} Mins</span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-theme-bg/50 border border-theme-border text-center">
              <span className="text-[9.5px] font-bold text-theme-muted uppercase block">Total Marks</span>
              <span className="text-xs sm:text-sm font-black text-theme-text">{totalMarks.toFixed(1)}</span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-theme-bg/50 border border-theme-border text-center">
              <span className="text-[9.5px] font-bold text-theme-muted uppercase block">Marking</span>
              <span className="text-xs sm:text-sm font-black text-amber-400">+{test.marks_per_question || 1.0} / -{negativeMarking}</span>
            </div>
          </div>

          {/* Instructions & Guidelines */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2 text-xs">
            <h4 className="font-black text-amber-500 uppercase tracking-wide flex items-center gap-1.5 text-[10.5px]">
              <AlertTriangle size={13} /> Strict Examination Rules
            </h4>
            <ul className="space-y-1.5 text-theme-muted text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Strict 1-Attempt Policy:</strong> Your submission is immutable and permanently records to the official statewide merit list.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Instant Evaluation:</strong> Your score, accuracy, statewide ranking, and masterclass solutions will unlock immediately upon submission.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Continuous Timer:</strong> Once started, the exam timer runs uninterrupted. Complete before time expires.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-5 border-t border-theme-border bg-theme-bg/60 flex items-center justify-end gap-2.5 sm:gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-theme-border hover:bg-theme-surface text-theme-muted hover:text-theme-text font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={onProceed}
            className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>Proceed to Exam Hall</span>
            <ArrowRight size={15} />
          </button>
        </div>

      </div>
    </div>
  );
}
