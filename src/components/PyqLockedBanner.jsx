import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Crown, Sparkles, ArrowRight, Zap, Award } from 'lucide-react';

export default function PyqLockedBanner({ subtitle }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-amber-500/30 dark:border-amber-500/40 bg-theme-surface shadow-card hover:shadow-card-hover backdrop-blur-2xl group transition-all duration-500"
    >
      {/* Subtle Ambient Accent Mesh */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Shimmer Light Beam */}
      <div className="pointer-events-none absolute inset-0 opacity-10 dark:opacity-20 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <Crown size={12} className="animate-pulse text-amber-600 dark:text-amber-400 shrink-0" />
            <span>PRO EXCLUSIVE • 100% OFFICIAL PYQs</span>
          </div>

          {/* Heading & Subtitle */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-theme-text tracking-tight flex items-center gap-3">
              <span>Unlock Official PYQ Masterclass</span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 font-extrabold">PRO</span>
            </h3>
            <p className="text-xs sm:text-sm text-theme-muted font-semibold mt-2 leading-relaxed opacity-90">
              {subtitle || "Master actual Previous Year Questions with step-by-step AI elimination logic, weightage trends, and option analysis."}
            </p>
          </div>

          {/* Feature Highlight Capsules */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-theme-text bg-theme-bg/90 dark:bg-theme-bg/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-theme-border/80 shadow-sm hover:border-amber-500/40 transition-colors">
              <Zap size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Real Exam Sprints</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-theme-text bg-theme-bg/90 dark:bg-theme-bg/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-theme-border/80 shadow-sm hover:border-amber-500/40 transition-colors">
              <Sparkles size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Elimination Assistant</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-theme-text bg-theme-bg/90 dark:bg-theme-bg/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-theme-border/80 shadow-sm hover:border-amber-500/40 transition-colors">
              <Award size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Rank Boosting Trends</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 pt-2 lg:pt-0">
          <button
            onClick={() => navigate('/upgrade')}
            className="group/btn relative overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:shadow-amber-500/35 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Lock size={15} className="group-hover/btn:rotate-12 transition-transform shrink-0" />
            <span>Unlock PYQ Masterclass</span>
            <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform shrink-0" />
          </button>
          <span className="text-[10px] text-theme-muted font-bold tracking-wider text-center lg:text-right opacity-80">
            Instant Pro Access • Risk Free
          </span>
        </div>
      </div>
    </motion.div>
  );
}
