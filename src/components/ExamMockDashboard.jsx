import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, ChevronRight, Lock, AlertCircle, CheckCircle2, TrendingUp, BookOpen, ChevronDown } from 'lucide-react';
import { generateMocksForExam, EXAM_CONFIG } from '../lib/mockEngine';
import { getSolvedMocks } from '../lib/db';
import { getScoreBand, isExamMockLockedForFreeUser, normalizeSolvedMocks } from '../lib/mockDashboardUi';
import { useEconomy } from '../context/EconomyContext';
import { useNavigate } from 'react-router-dom';

// ─── Accomplishment Badge ───────────────────────────────────────────
function SolvedBadge({ solvedInfo }) {
  if (!solvedInfo) return null;
  const band = getScoreBand(solvedInfo);
  const Icon = solvedInfo.percentage >= 80 ? CheckCircle2 : TrendingUp;

  return (
    <div className={`absolute -top-2 -right-2 z-20 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md ${band.className} mock-score-badge`}>
      <Icon size={8} />
      {solvedInfo.percentage}%
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

/** Elite Mock tile (100Q / 100M) */
function EliteTile({ mock, index, examId, solvedMap, isLocked, proTitle }) {
  const navigate  = useNavigate();
  const solved    = solvedMap?.[mock.id];
  const band      = getScoreBand(solved);

  if (mock.isEmpty || isLocked) {
    return (
      <div 
        onClick={isLocked ? () => navigate('/upgrade') : undefined}
        className={`group relative rounded-2xl p-5 overflow-hidden ${isLocked ? 'mock-locked-card cursor-pointer hover:scale-[1.02] hover:border-theme-primary/40 transition-all duration-300' : 'mock-locked-tile-3d'}`}
      >
        {isLocked && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-theme-primary/15 via-transparent to-transparent" />
            <div className="absolute top-2 right-2 z-20">
              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-theme-primary/40 bg-theme-primary/15 text-theme-primary shadow-sm animate-pulse">Pro</span>
            </div>
          </>
        )}
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${isLocked ? 'mock-locked-mark border-theme-primary/30' : 'bg-theme-bg/60 border-theme-border text-theme-muted'}`}>
            <Lock size={18} className={isLocked ? 'text-theme-primary' : ''} />
          </div>
          <div>
            <h4 className={`font-black text-sm ${isLocked ? 'mock-pro-title text-theme-primary/95' : 'text-theme-muted'}`}>
              {isLocked ? proTitle : `Full Mock ${index}`}
            </h4>
            <p className="text-[10px] uppercase tracking-[0.15em] text-theme-muted/70 font-bold mt-1">
              {isLocked ? '✦ Pro Content' : 'No questions yet'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <SolvedBadge solvedInfo={solved} />
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/mock-test', { state: { mock, from: '/', examId } })}
        className={`group relative rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-500
          ${band ? `${band.className} mock-score-card border` : 'mock-tile-3d'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-theme-primary/0 to-theme-primary/8 group-hover:to-theme-primary/15 transition-all duration-700 rounded-2xl" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-theme-primary/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-theme-primary/25 transition-colors duration-700" />

        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-400 shadow-md
            ${band ? `${band.className} mock-score-tile border group-hover:scale-110` : 'bg-theme-bg/60 border border-theme-border text-theme-primary group-hover:bg-theme-primary group-hover:text-white group-hover:border-theme-primary group-hover:scale-110'}`}
          >
            {index}
          </div>
          <div>
            <h4 className={`font-black text-sm transition-colors
              ${band ? `${band.className} mock-score-text` : 'text-theme-text group-hover:text-theme-primary'}`}
            >
              Full Mock {index}
            </h4>
            <p className={`text-[10px] uppercase tracking-[0.15em] font-bold mt-1
              ${band ? `${band.className} mock-score-text opacity-80` : 'text-theme-primary/70'}`}
            >
              {solved ? `Best: ${solved.percentage}%` : '100Q • 100 Min'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** Quick Mock row item */
function QuickMockRow({ mock, examId, solvedMap, isLocked, proTitle }) {
  const navigate = useNavigate();
  const solved   = solvedMap?.[mock.id];
  const band     = getScoreBand(solved);

  if (mock.isEmpty || isLocked) {
    return (
      <div 
        onClick={isLocked ? () => navigate('/upgrade') : undefined}
        className={`flex items-center justify-between gap-4 p-4 rounded-xl ${isLocked ? 'mock-locked-card cursor-pointer hover:scale-[1.01] hover:border-theme-primary/40 transition-all duration-300' : 'mock-locked-tile-3d'}`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center ${isLocked ? 'mock-locked-mark border-theme-primary/20 bg-theme-primary/5' : 'bg-theme-bg/60 border-theme-border text-theme-muted'}`}>
            <Lock size={14} className={isLocked ? 'text-theme-primary' : ''} />
          </div>
          <div className="min-w-0">
            <h4 className={`text-sm font-bold leading-tight ${isLocked ? 'mock-pro-title text-theme-text' : 'text-theme-muted'}`}>
              {isLocked ? proTitle : mock.title}
            </h4>
            <p className="text-[10px] uppercase tracking-widest mt-0.5 mock-pro-sublabel">
              {isLocked ? '✦ Exclusive Pro Content' : 'No questions yet'}
            </p>
          </div>
        </div>
        {isLocked && <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-theme-primary/30 bg-theme-primary/10 text-theme-primary shadow-sm">Pro</span>}
      </div>
    );
  }

  return (
    <motion.div
      layout
      whileHover={{ x: 4 }}
      onClick={() => navigate('/mock-test', { state: { mock, from: '/', examId } })}
      className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300
        ${band ? `${band.className} mock-score-card border` : 'mock-tile-3d'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 shrink-0 rounded-xl font-black text-sm flex items-center justify-center transition-all shadow-sm
          ${band ? `${band.className} mock-score-tile border` : 'bg-theme-bg/60 border border-theme-border text-theme-text group-hover:bg-theme-primary group-hover:text-white group-hover:border-theme-primary'}`}
        >
          {mock.index}
        </div>
        <div>
          <h4 className={`text-sm font-bold leading-tight transition-colors
            ${band ? `${band.className} mock-score-text` : 'text-theme-text group-hover:text-theme-primary'}`}
          >
            {mock.title}
          </h4>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-0.5 opacity-60">
            {solved ? `Solved · Best ${solved.percentage}%` : '10 Qs • 10 Mins'}
          </p>
        </div>
      </div>
      {solved ? (
        <div className={`shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${band.className} mock-score-pill`}>
          {solved.percentage >= 80 ? <CheckCircle2 size={10} /> : <TrendingUp size={10} />}
          {band.label}
        </div>
      ) : (
        <ChevronRight size={16} className="text-theme-muted group-hover:text-theme-primary group-hover:translate-x-1 transition-all shrink-0" />
      )}
    </motion.div>
  );
}

/** Sectional Mock row item */
function SectionalMockRow({ mock, examId, solvedMap, isLocked, proTitle }) {
  const navigate = useNavigate();
  const solved   = solvedMap?.[mock.id];
  const band     = getScoreBand(solved);

  if (mock.isEmpty || isLocked) {
    return (
      <div 
        onClick={isLocked ? () => navigate('/upgrade') : undefined}
        className={`flex items-center justify-between gap-4 p-4 rounded-xl ${isLocked ? 'mock-locked-card cursor-pointer hover:scale-[1.01] hover:border-theme-primary/40 transition-all duration-300' : 'mock-locked-tile-3d'}`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center ${isLocked ? 'mock-locked-mark border-theme-primary/20 bg-theme-primary/5' : 'bg-theme-bg/60 border-theme-border text-theme-muted'}`}>
            <Lock size={14} className={isLocked ? 'text-theme-primary' : ''} />
          </div>
          <div className="min-w-0">
            <h4 className={`text-sm font-bold leading-tight ${isLocked ? 'mock-pro-title text-theme-text' : 'text-theme-muted'}`}>
              {isLocked ? proTitle : mock.title}
            </h4>
            <p className="text-[10px] uppercase tracking-widest mt-0.5 mock-pro-sublabel">
              {isLocked ? '✦ Exclusive Pro Content' : 'No questions yet'}
            </p>
          </div>
        </div>
        {isLocked && <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-theme-primary/30 bg-theme-primary/10 text-theme-primary shadow-sm">Pro</span>}
      </div>
    );
  }

  return (
    <motion.div
      layout
      whileHover={{ x: 4 }}
      onClick={() => navigate('/mock-test', { state: { mock, from: '/', examId } })}
      className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300
        ${band ? `${band.className} mock-score-card border` : 'mock-tile-3d'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 shrink-0 rounded-xl font-black text-sm flex items-center justify-center transition-all shadow-sm
          ${band ? `${band.className} mock-score-tile border` : 'bg-theme-bg/60 border border-theme-border text-theme-text group-hover:bg-theme-accent group-hover:text-white group-hover:border-theme-accent'}`}
        >
          {mock.index}
        </div>
        <div>
          <h4 className={`text-sm font-bold leading-tight transition-colors
            ${band ? `${band.className} mock-score-text` : 'text-theme-text group-hover:text-theme-accent'}`}
          >
            {mock.title}
          </h4>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-0.5 opacity-60">
            {solved ? `Solved · Best ${solved.percentage}%` : '10 Qs • 10 Mins'}
          </p>
        </div>
      </div>
      {solved ? (
        <div className={`shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${band.className} mock-score-pill`}>
          {solved.percentage >= 80 ? <CheckCircle2 size={10} /> : <TrendingUp size={10} />}
          {band.label}
        </div>
      ) : (
        <ChevronRight size={16} className="text-theme-muted group-hover:text-theme-accent group-hover:translate-x-1 transition-all shrink-0" />
      )}
    </motion.div>
  );
}

/** Empty state when a section has no content */
function EmptyState({ label }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center col-span-full"
    >
      <div className="w-16 h-16 rounded-2xl bg-theme-surface border border-theme-border flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-theme-muted" />
      </div>
      <h3 className="font-black text-theme-text text-lg">No mocks available</h3>
      <p className="text-theme-muted text-sm mt-2 max-w-xs leading-relaxed">
        Questions for <span className="font-bold text-theme-text">{label}</span> are being
        prepared. Check back soon!
      </p>
    </motion.div>
  );
}

// ─── Filter Tab Bar ────────────────────────────────────────────────
function FilterBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === tab.id
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30'
              : 'bg-theme-surface/50 text-theme-muted border border-theme-border hover:border-theme-primary/40 hover:text-theme-text'
          }`}
        >
          {activeTab === tab.id && (
            <motion.span
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-xl bg-theme-primary"
              style={{ zIndex: -1 }}
            />
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Accomplishment Progress Bar ──────────────────────────────────
function AccomplishmentBar({ mocks, solvedMap, label }) {
  const nonEmpty = mocks.filter(m => !m.isEmpty);
  const total    = nonEmpty.length;
  if (total === 0) return null;

  const solvedCount = nonEmpty.filter(m => solvedMap?.[m.id]).length;
  const pct         = Math.round((solvedCount / total) * 100);

  return (
    <div className="mock-progress-glass flex items-center gap-4 rounded-2xl px-4 py-3" aria-label={`${label} completion`}>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-theme-muted">{label} progress</span>
          <span className="text-xs font-black text-theme-text/80 whitespace-nowrap">
            {solvedCount}/{total}
          </span>
        </div>
        <div className="mock-progress-track h-2.5 rounded-full overflow-hidden">
          <div
            className="mock-progress-fill h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="mock-progress-trophy w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center">
        <Trophy size={18} />
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ────────────────────────────────────

export default function ExamMockDashboard({ exam, onBack }) {
  const config = EXAM_CONFIG[exam.id];
  const { economy } = useEconomy();
  const [activeTab, setActiveTab]     = useState('all');
  const [showAllElite, setShowAllElite] = useState(false);
  const [showAllQuick, setShowAllQuick] = useState(false);
  const [solvedMap, setSolvedMap]     = useState({});

  const MAX_VISIBLE = 8;

  const { eliteMocks, quickMocks, sectionalMocks, pyqMocks = {} } = useMemo(
    () => generateMocksForExam(exam.id),
    [exam.id]
  );

  // Load solved state from IndexedDB
  useEffect(() => {
    getSolvedMocks().then(records => setSolvedMap(normalizeSolvedMocks(records))).catch(() => {});
  }, [exam.id]);

  // Reset showAllQuick when switching tabs
  useEffect(() => {
    setShowAllQuick(false);
  }, [activeTab]);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertCircle size={40} className="text-rose-400 mb-4" />
        <h3 className="font-black text-theme-text text-xl">Exam not configured</h3>
        <p className="text-theme-muted mt-2">No syllabus map found for this exam series.</p>
        <button onClick={onBack} className="mt-6 px-6 py-2.5 bg-theme-primary text-white rounded-xl font-bold text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'all', label: 'Quick Mocks' },
    ...config.categories.map(catId => ({
      id: catId,
      label: config.categoryLabels?.[catId] || catId,
    })),
  ];

  const isSectionalTab = activeTab !== 'all';
  const sectionalData  = isSectionalTab ? (sectionalMocks[activeTab] || []) : [];
  const allEmpty       = isSectionalTab && sectionalData.every(m => m.isEmpty);
  const allQuickEmpty  = quickMocks.every(m => m.isEmpty);
  const allEliteEmpty  = eliteMocks.every(m => m.isEmpty);
  const userTier       = economy?.user_tier || 'FREE';

  const displayedElite = showAllElite ? eliteMocks : eliteMocks.slice(0, 5);
  
  const currentMocks = activeTab === 'all' ? quickMocks : sectionalData;
  const displayedQuick = showAllQuick ? currentMocks : currentMocks.slice(0, MAX_VISIBLE);
  const hasMoreQuick = currentMocks.length > MAX_VISIBLE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      {/* ── Header ── */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-theme-muted hover:text-theme-text transition-colors mb-6 group font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="flex items-end gap-5">
          <div
            className="w-14 h-14 rounded-2xl border border-theme-border/30 flex items-center justify-center text-white shadow-xl"
            style={{ 
              background: exam.color ? `linear-gradient(135deg, ${exam.color}, ${exam.color}dd)` : 'var(--gradient-primary)'
            }}
          >
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-muted opacity-60 mb-1">
              Official Series
            </p>
            <h1 className="text-3xl font-black text-theme-text tracking-tighter leading-none">
              {config.fullName}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-bold text-theme-muted opacity-80">
                {eliteMocks.length} Elite • {quickMocks.length} Quick • {config.categories.length} Sections
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Elite Full-Length Mocks ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
              <Trophy size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-theme-text uppercase tracking-tight">
                  Elite Full Mocks
                </h2>
                <span className="px-2 py-0.5 rounded-lg bg-theme-primary/15 text-theme-primary text-[9px] font-black border border-theme-primary/25 uppercase tracking-widest">
                  Elite
                </span>
              </div>
              <p className="text-[11px] text-theme-muted font-bold mt-0.5 opacity-70">
                100Q • 100M — Full Syllabus Coverage
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowAllElite(!showAllElite)}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-primary transition-all shadow-sm"
          >
            {showAllElite ? 'Show Less' : 'View All'}
          </button>
        </div>

        {/* Elite progress bar */}
        {!allEliteEmpty && (
          <div className="mb-4">
            <AccomplishmentBar mocks={eliteMocks} solvedMap={solvedMap} label="Elite" />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allEliteEmpty ? (
            <EmptyState label="Elite Mocks" />
          ) : (
            <AnimatePresence>
              {(() => {
                let proCounter = 0;
                return displayedElite.map((mock) => {
                  const locked = isExamMockLockedForFreeUser(mock, userTier);
                  if (locked) proCounter++;
                  return (
                    <EliteTile
                      key={mock.id}
                      mock={mock}
                      index={mock.index}
                      examId={exam.id}
                      solvedMap={solvedMap}
                      isLocked={locked}
                      proTitle={`Elite Mock ${mock.index}`}
                    />
                  );
                });
              })()}
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ── Filter Bar + Content ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
            <Zap size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-text uppercase tracking-tight">
              {activeTab === 'all'
                ? `Quick Mocks (${quickMocks.length})`
                : `${config.categoryLabels?.[activeTab] || activeTab} Sectional`}
            </h2>
            <p className="text-[11px] text-theme-muted font-bold mt-0.5 opacity-70">
              {activeTab === 'all'
                ? 'Weighted by syllabus — 10Q • 10M'
                : '70 focused mocks • 10Q • 10M'}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4">
          <FilterBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Progress bar for current view */}
        <div className="mb-4">
          <AccomplishmentBar
            mocks={activeTab === 'all' ? quickMocks : sectionalData}
            solvedMap={solvedMap}
            label={activeTab === 'all' ? 'Quick' : config.categoryLabels?.[activeTab] || activeTab}
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'all' ? (
            <motion.div
              key="quick"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {allQuickEmpty ? (
                <EmptyState label="Quick Mocks" />
              ) : (
                (() => {
                  let proCounter = 0;
                  return displayedQuick.map(mock => {
                    const locked = isExamMockLockedForFreeUser(mock, userTier);
                    if (locked) proCounter++;
                    return (
                      <QuickMockRow
                        key={mock.id}
                        mock={mock}
                        examId={exam.id}
                        solvedMap={solvedMap}
                        isLocked={locked}
                        proTitle={`${config.label} Quick Pro Mock ${proCounter}`}
                      />
                    );
                  });
                })()
              )}
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {allEmpty ? (
                <EmptyState label={config.categoryLabels?.[activeTab] || activeTab} />
              ) : (
                (() => {
                  let proCounter = 0;
                  const catLabel = config.categoryLabels?.[activeTab] || activeTab;
                  return displayedQuick.map(mock => {
                    const locked = isExamMockLockedForFreeUser(mock, userTier);
                    if (locked) proCounter++;
                    return (
                      <SectionalMockRow
                        key={mock.id}
                        mock={mock}
                        examId={exam.id}
                        solvedMap={solvedMap}
                        isLocked={locked}
                        proTitle={`${catLabel} ${config.label} Pro Mock ${proCounter}`}
                      />
                    );
                  });
                })()
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* View All / View Less toggle for Quick/Sectional mocks */}
        {hasMoreQuick && !allQuickEmpty && !allEmpty && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowAllQuick(!showAllQuick)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              <span className="text-xs font-black uppercase tracking-widest">
                {showAllQuick ? 'View Less Mocks' : `View All ${currentMocks.length} Mocks`}
              </span>
              <ChevronDown 
                size={14} 
                className={`transition-transform duration-500 ${showAllQuick ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
        )}
      </section>

      {/* ── PYQ Masterclass ── */}
      {Object.keys(pyqMocks).length > 0 && (
        <section className="mt-12 pt-10 border-t border-theme-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-theme-text uppercase tracking-tight flex items-center gap-2">
                PYQ Masterclass
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 text-[10px] font-black border border-amber-500/30 tracking-widest">OFFICIAL</span>
              </h2>
              <p className="text-xs text-theme-muted font-bold mt-1 opacity-80">
                Official Previous Year Questions divided into 10Q Sprints
              </p>
            </div>
          </div>
          
          <div className="mb-8">
            <AccomplishmentBar
              mocks={Object.values(pyqMocks).flat()}
              solvedMap={solvedMap}
              label="PYQ"
            />
          </div>

          <div className="space-y-8">
            {Object.keys(pyqMocks).sort((a,b) => b.localeCompare(a)).map(year => (
              <div key={year}>
                <h3 className="text-sm font-bold text-theme-muted mb-3 uppercase tracking-wider pl-1">{year === 'Unknown' ? 'Mixed PYQs' : `${year} Papers`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pyqMocks[year].map(mock => (
                    <QuickMockRow
                      key={mock.id}
                      mock={mock}
                      examId={exam.id}
                      solvedMap={solvedMap}
                      isLocked={isExamMockLockedForFreeUser(mock, userTier)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </motion.div>
  );
}
